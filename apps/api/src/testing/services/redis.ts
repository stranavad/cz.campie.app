import { RedisContainer } from '@testcontainers/redis';
import { Redis } from 'ioredis';

import type { TestService } from './test-service.ts';

// The same image as Docker Compose.
const IMAGE = 'redis:8.8.3-alpine';
const URL_VARIABLE = 'REDIS_URL';
// Logical databases a test can take; one per test running at the same time, since cleanup returns it.
const DATABASES = 256;
// Bookkeeping in database 0, which no test gets.
const NEXT_DATABASE = 'test:next-database';
const FREE_DATABASES = 'test:free-databases';

async function withRedis<T>(url: string, work: (redis: Redis) => Promise<T>): Promise<T> {
  const redis = new Redis(url);

  try {
    return await work(redis);
  } finally {
    redis.disconnect();
  }
}

function withDatabase(url: string, database: number): string {
  const result = new URL(url);
  result.pathname = `/${database}`;

  return result.toString();
}

// Redis starts once per run without persistence; each test gets its own logical database, emptied and
// handed to a later test when it ends, so no test sees another's jobs.
export const redis = {
  async start() {
    const container = await new RedisContainer(IMAGE)
      .withCommand(['redis-server', '--databases', String(DATABASES), '--save', '', '--appendonly', 'no'])
      .start();

    return {
      env: { [URL_VARIABLE]: withDatabase(container.getConnectionUrl(), 0) },
      cleanup: async () => void (await container.stop()),
    };
  },

  async isolate(env) {
    const serverUrl = env[URL_VARIABLE];

    if (serverUrl === undefined) {
      throw new Error(`The redis test service provided no ${URL_VARIABLE}`);
    }

    const database = await withRedis(serverUrl, async (client) =>
      Number((await client.lpop(FREE_DATABASES)) ?? (await client.incr(NEXT_DATABASE))),
    );

    if (database >= DATABASES) {
      throw new Error(`More than ${DATABASES - 1} tests use Redis at the same time`);
    }

    const url = withDatabase(serverUrl, database);

    return {
      env: { [URL_VARIABLE]: url },
      cleanup: async () => {
        await withRedis(url, (client) => client.flushdb());
        await withRedis(serverUrl, (client) => client.rpush(FREE_DATABASES, database));
      },
    };
  },
} satisfies TestService;
