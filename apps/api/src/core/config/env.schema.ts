import { z } from 'zod';

export const envSchema = z.object({
  APP_ENV: z.enum(['local', 'test', 'production']),

  DATABASE_URL: z.url(),
  REDIS_URL: z.url(),

  S3_ENDPOINT: z.url(),
  S3_REGION: z.string().min(1),
  S3_BUCKET: z.string().min(1),
  S3_ACCESS_KEY_ID: z.string().min(1),
  S3_SECRET_ACCESS_KEY: z.string().min(1),

  GOTENBERG_URL: z.url(),
});

export type Env = z.infer<typeof envSchema>;
