import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';
import pg from 'pg';

import type { Env } from '../config/env.schema.ts';
import { FileStorage } from '../ports/file-storage/file-storage.port.ts';
import { PdfRenderer } from '../ports/pdf-renderer/pdf-renderer.port.ts';

// A health check must answer even when a service hangs, so no probe waits longer than this.
const PROBE_TIMEOUT_MS = 2000;

const SERVICES = ['database', 'redis', 'fileStorage', 'pdfRenderer'] as const;

type Service = (typeof SERVICES)[number];
type ServiceHealth = 'up' | 'down';

export interface HealthReport {
  status: 'ok' | 'unavailable';
  services: Record<Service, ServiceHealth>;
}

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);

  constructor(
    private readonly config: ConfigService<Env, true>,
    private readonly fileStorage: FileStorage,
    private readonly pdfRenderer: PdfRenderer,
  ) {}

  /**
   * Probe every external service the API depends on.
   */
  public async check(): Promise<HealthReport> {
    const pings: Record<Service, (signal: AbortSignal) => Promise<void>> = {
      database: () => this.pingDatabase(),
      redis: () => this.pingRedis(),
      fileStorage: (signal) => this.fileStorage.ping(signal),
      pdfRenderer: (signal) => this.pdfRenderer.ping(signal),
    };

    const results = await Promise.all(
      SERVICES.map(async (service) => [service, await this.probe(service, pings[service])] as const),
    );
    // Every Service is mapped above, so the entries cover the whole record.
    const services = Object.fromEntries(results) as Record<Service, ServiceHealth>;

    return {
      status: Object.values(services).every((health) => health === 'up') ? 'ok' : 'unavailable',
      services,
    };
  }

  /**
   * Run one probe, logging why a service is down.
   * @param service name in the report
   * @param ping resolves when the service answers; should give up once the signal aborts
   */
  private async probe(service: Service, ping: (signal: AbortSignal) => Promise<void>): Promise<ServiceHealth> {
    const timeout = AbortSignal.timeout(PROBE_TIMEOUT_MS);
    // Raced as well, for a probe that cannot be cancelled.
    const timedOut = new Promise<never>((_, reject) => {
      timeout.addEventListener('abort', () => reject(new Error(`no answer within ${PROBE_TIMEOUT_MS} ms`)));
    });

    try {
      await Promise.race([ping(timeout), timedOut]);

      return 'up';
    } catch (error) {
      this.logger.warn(`${service} is down: ${error instanceof Error ? error.message : String(error)}`);

      return 'down';
    }
  }

  /**
   * Connect to PostgreSQL and run a trivial query.
   */
  private async pingDatabase(): Promise<void> {
    const client = new pg.Client({
      connectionString: this.config.get('DATABASE_URL', { infer: true }),
      connectionTimeoutMillis: PROBE_TIMEOUT_MS,
      query_timeout: PROBE_TIMEOUT_MS,
    });

    try {
      await client.connect();
      await client.query('SELECT 1');
    } finally {
      await client.end();
    }
  }

  /**
   * Connect to Redis and send PING.
   */
  private async pingRedis(): Promise<void> {
    const redis = new Redis(this.config.get('REDIS_URL', { infer: true }), {
      lazyConnect: true,
      connectTimeout: PROBE_TIMEOUT_MS,
      commandTimeout: PROBE_TIMEOUT_MS,
      maxRetriesPerRequest: 0,
      retryStrategy: () => null,
    });
    // The failure surfaces through connect(); without a listener ioredis also prints it as unhandled.
    redis.on('error', () => undefined);

    try {
      await redis.connect();
      await redis.ping();
    } finally {
      redis.disconnect();
    }
  }
}
