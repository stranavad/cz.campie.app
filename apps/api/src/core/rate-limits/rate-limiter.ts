import { createHash, randomUUID } from 'node:crypto';
import { Injectable, type OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';

import type { Env } from '../config/env.schema.ts';
import { Clock } from '../ports/clock/clock.port.ts';

// At most `max` attempts per subject within the last `windowMs`.
export interface RateLimit {
  readonly name: string;
  readonly max: number;
  readonly windowMs: number;
}

// An attempt counted against a limit. Release it once the attempt turns out not to count, such as a
// login that succeeded.
export interface Attempt {
  release(): Promise<void>;
}

// Counts attempts in Redis, so a limit holds across API instances, and by the Clock, so tests move time.
// Each limit keeps one sorted set per subject: an entry per attempt, scored by its time.
@Injectable()
export class RateLimiter implements OnModuleDestroy {
  private readonly redis: Redis;

  constructor(
    private readonly clock: Clock,
    config: ConfigService<Env, true>,
  ) {
    // A request fails rather than waits while Redis is unreachable: a limit that cannot be checked refuses.
    this.redis = new Redis(config.get('REDIS_URL', { infer: true }), { lazyConnect: true, maxRetriesPerRequest: 1 });
    // Failures reach the command that hit them; without a listener ioredis also prints them as unhandled.
    this.redis.on('error', () => undefined);
  }

  public onModuleDestroy(): void {
    this.redis.disconnect();
  }

  /**
   * Count an attempt against a limit, unless the limit is already reached. The count and the check are
   * one atomic step, so simultaneous attempts never slip past the limit together.
   * @param limit the limit
   * @param subject whom the limit applies to, such as an email or an IP address
   * @throws {Error} when Redis does not answer as expected
   * @returns the counted attempt, or null when the limit refused it
   */
  public async take(limit: RateLimit, subject: string): Promise<Attempt | null> {
    const key = keyOf(limit, subject);
    const now = this.clock.now().getTime();
    const entry = randomUUID();

    const results = await this.redis
      .multi()
      .zremrangebyscore(key, '-inf', now - limit.windowMs)
      .zadd(key, now, entry)
      .zcard(key)
      .pexpire(key, limit.windowMs)
      .exec();
    const count = results?.[2]?.[1];

    if (typeof count !== 'number') {
      throw new Error(`Rate limit ${limit.name} could not be counted`);
    }

    const attempt: Attempt = { release: async () => void (await this.redis.zrem(key, entry)) };

    if (count > limit.max) {
      await attempt.release();

      return null;
    }

    return attempt;
  }

  /**
   * Forget every attempt a subject made under a limit.
   * @param limit the limit
   * @param subject whom the limit applies to
   */
  public async clear(limit: RateLimit, subject: string): Promise<void> {
    await this.redis.del(keyOf(limit, subject));
  }
}

// Redis is outside the encryption and erasure, so the subject (an email, an IP address) is only stored
// hashed, and only until its window ends.
function keyOf(limit: RateLimit, subject: string): string {
  return `rate-limit:${limit.name}:${createHash('sha256').update(subject).digest('base64url')}`;
}
