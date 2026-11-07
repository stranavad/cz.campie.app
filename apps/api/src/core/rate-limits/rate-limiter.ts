import { createHash, randomUUID } from 'node:crypto';
import { HttpException, HttpStatus, Injectable, type OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';

import type { RequestLimitErrorCode } from '@repo/schema/shared';

import type { Env } from '../config/env.schema.ts';
import { Clock } from '../ports/clock/clock.port.ts';
import { addressSubject } from './address-subject.ts';

// At most `max` attempts per subject within the last `windowMs`.
export interface RateLimit {
  readonly name: string;
  readonly max: number;
  readonly windowMs: number;
}

// A kind of anonymous request's limits: one per IP address, one per target (the email a request is for,
// an Organisation).
export interface RequestLimit {
  readonly ip: RateLimit;
  readonly target: RateLimit;
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
   * Count an anonymous request against its limits by IP address and by target, before it does anything.
   * A refused request counts against neither, so a flood from one address does not lock its target out
   * for longer, nor the reverse.
   * @param limit the kind of request's limits
   * @param subjects the request's IP address and its target, normalised (a lowercase email)
   * @throws {HttpException} 429 requests_throttled when either limit is reached
   */
  public async admit(limit: RequestLimit, subjects: { ipAddress: string; target: string }): Promise<void> {
    const byIp = await this.take(limit.ip, addressSubject(subjects.ipAddress));

    if (byIp === null) {
      throw requestsThrottled();
    }

    if ((await this.take(limit.target, subjects.target)) === null) {
      await byIp.release();

      throw requestsThrottled();
    }
  }

  /**
   * Count an anonymous request against its IP address's limit alone, for a request that counts against
   * its target only once it proves genuine (`admitTarget`).
   * @param limit the kind of request's limits
   * @param ipAddress the request's IP address
   * @throws {HttpException} 429 requests_throttled when the limit is reached
   */
  public async admitAddress(limit: RequestLimit, ipAddress: string): Promise<void> {
    if ((await this.take(limit.ip, addressSubject(ipAddress))) === null) {
      throw requestsThrottled();
    }
  }

  /**
   * Count an anonymous request against its target's limit alone, after `admitAddress`.
   * @param limit the kind of request's limits
   * @param target the request's target, normalised
   * @throws {HttpException} 429 requests_throttled when the limit is reached
   */
  public async admitTarget(limit: RequestLimit, target: string): Promise<void> {
    if ((await this.take(limit.target, target)) === null) {
      throw requestsThrottled();
    }
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

function requestsThrottled(): HttpException {
  const code: RequestLimitErrorCode = 'requests_throttled';

  return new HttpException({ code, message: 'Too many requests, try later' }, HttpStatus.TOO_MANY_REQUESTS);
}

// Redis is outside the encryption and erasure, so the subject (an email, an IP address) is only stored
// hashed, and only until its window ends.
function keyOf(limit: RateLimit, subject: string): string {
  return `rate-limit:${limit.name}:${createHash('sha256').update(subject).digest('base64url')}`;
}
