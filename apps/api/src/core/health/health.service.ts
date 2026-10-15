import { HeadBucketCommand, S3Client } from '@aws-sdk/client-s3';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';
import pg from 'pg';

import type { Env } from '../config/env.schema.ts';

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

  constructor(private readonly config: ConfigService<Env, true>) {}

  /**
   * Probe every external service the API depends on.
   */
  public async check(): Promise<HealthReport> {
    const pings: Record<Service, () => Promise<void>> = {
      database: () => this.pingDatabase(),
      redis: () => this.pingRedis(),
      fileStorage: () => this.pingFileStorage(),
      pdfRenderer: () => this.pingPdfRenderer(),
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
   * @param ping resolves when the service answers
   */
  private async probe(service: Service, ping: () => Promise<void>): Promise<ServiceHealth> {
    try {
      await ping();

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

  /**
   * Check that the configured bucket exists and the credentials can reach it.
   */
  private async pingFileStorage(): Promise<void> {
    const s3 = new S3Client({
      endpoint: this.config.get('S3_ENDPOINT', { infer: true }),
      region: this.config.get('S3_REGION', { infer: true }),
      credentials: {
        accessKeyId: this.config.get('S3_ACCESS_KEY_ID', { infer: true }),
        secretAccessKey: this.config.get('S3_SECRET_ACCESS_KEY', { infer: true }),
      },
      forcePathStyle: true,
      maxAttempts: 1,
    });

    try {
      await s3.send(new HeadBucketCommand({ Bucket: this.config.get('S3_BUCKET', { infer: true }) }), {
        abortSignal: AbortSignal.timeout(PROBE_TIMEOUT_MS),
      });
    } finally {
      s3.destroy();
    }
  }

  /**
   * Ask Gotenberg for its own health.
   * @throws {Error} when Gotenberg answers with a non-success status
   */
  private async pingPdfRenderer(): Promise<void> {
    const response = await fetch(new URL('/health', this.config.get('GOTENBERG_URL', { infer: true })), {
      signal: AbortSignal.timeout(PROBE_TIMEOUT_MS),
    });

    if (!response.ok) {
      throw new Error(`Gotenberg answered ${response.status}`);
    }
  }
}
