import { z } from 'zod';

const nonEmpty = z.string().min(1);

// Each port is chosen by one `<PORT>_ADAPTER` variable; only the chosen adapter's variables are required.
// The parsed value is nested per port, so an adapter's settings are typed by the adapter it belongs to.

// Both adapters take the same URL, as the application role.
const database = z
  .object({ DATABASE_ADAPTER: z.enum(['neon', 'pg']), DATABASE_URL: z.url() })
  .transform((env) => ({ database: { adapter: env.DATABASE_ADAPTER, url: env.DATABASE_URL } }));

const clock = z
  .discriminatedUnion('CLOCK_ADAPTER', [
    z.object({ CLOCK_ADAPTER: z.literal('system') }),
    z.object({ CLOCK_ADAPTER: z.literal('controllable') }),
  ])
  .transform((env) => ({ clock: { adapter: env.CLOCK_ADAPTER } }));

const mail = z
  .discriminatedUnion('MAIL_ADAPTER', [
    z.object({ MAIL_ADAPTER: z.literal('resend'), RESEND_API_KEY: nonEmpty }),
    z.object({ MAIL_ADAPTER: z.enum(['log', 'fake']) }),
  ])
  .transform((env) => ({
    mail:
      env.MAIL_ADAPTER === 'resend'
        ? { adapter: env.MAIL_ADAPTER, apiKey: env.RESEND_API_KEY }
        : { adapter: env.MAIL_ADAPTER },
  }));

const fileStorage = z
  .discriminatedUnion('FILE_STORAGE_ADAPTER', [
    z.object({
      FILE_STORAGE_ADAPTER: z.literal('tigris'),
      TIGRIS_STORAGE_ENDPOINT: z.url(),
      TIGRIS_STORAGE_BUCKET: z.string().min(1),
      TIGRIS_STORAGE_ACCESS_KEY_ID: nonEmpty,
      TIGRIS_STORAGE_SECRET_ACCESS_KEY: nonEmpty,
    }),
    z.object({
      FILE_STORAGE_ADAPTER: z.literal('s3'),
      S3_ENDPOINT: z.url(),
      S3_REGION: z.string().min(1),
      S3_BUCKET: z.string().min(1),
      S3_ACCESS_KEY_ID: nonEmpty,
      S3_SECRET_ACCESS_KEY: nonEmpty,
    }),
    z.object({ FILE_STORAGE_ADAPTER: z.literal('memory') }),
  ])
  .transform((env) => ({
    fileStorage:
      env.FILE_STORAGE_ADAPTER === 'tigris'
        ? {
            adapter: env.FILE_STORAGE_ADAPTER,
            endpoint: env.TIGRIS_STORAGE_ENDPOINT,
            bucket: env.TIGRIS_STORAGE_BUCKET,
            accessKeyId: env.TIGRIS_STORAGE_ACCESS_KEY_ID,
            secretAccessKey: env.TIGRIS_STORAGE_SECRET_ACCESS_KEY,
          }
        : env.FILE_STORAGE_ADAPTER === 's3'
          ? {
              adapter: env.FILE_STORAGE_ADAPTER,
              endpoint: env.S3_ENDPOINT,
              region: env.S3_REGION,
              bucket: env.S3_BUCKET,
              accessKeyId: env.S3_ACCESS_KEY_ID,
              secretAccessKey: env.S3_SECRET_ACCESS_KEY,
            }
          : { adapter: env.FILE_STORAGE_ADAPTER },
  }));

const pdfRenderer = z
  .discriminatedUnion('PDF_RENDERER_ADAPTER', [
    z.object({
      PDF_RENDERER_ADAPTER: z.literal('gotenberg'),
      GOTENBERG_URL: z.url(),
    }),
    z.object({ PDF_RENDERER_ADAPTER: z.literal('fake') }),
  ])
  .transform((env) => ({
    pdfRenderer:
      env.PDF_RENDERER_ADAPTER === 'gotenberg'
        ? { adapter: env.PDF_RENDERER_ADAPTER, url: env.GOTENBERG_URL }
        : { adapter: env.PDF_RENDERER_ADAPTER },
  }));

const paymentGateway = z
  .discriminatedUnion('PAYMENT_GATEWAY_ADAPTER', [
    z.object({ PAYMENT_GATEWAY_ADAPTER: z.literal('comgate') }),
    z.object({ PAYMENT_GATEWAY_ADAPTER: z.literal('fake') }),
  ])
  .transform((env) => ({ paymentGateway: { adapter: env.PAYMENT_GATEWAY_ADAPTER } }));

const MASTER_KEY_BYTES = 32;

const keyProvider = z
  .discriminatedUnion('KEY_PROVIDER_ADAPTER', [
    z.object({
      KEY_PROVIDER_ADAPTER: z.literal('secret'),
      MASTER_KEY: z.base64().refine((value) => Buffer.from(value, 'base64').length === MASTER_KEY_BYTES, {
        message: `must be ${MASTER_KEY_BYTES} random bytes in base64`,
      }),
    }),
    z.object({ KEY_PROVIDER_ADAPTER: z.literal('fixed') }),
  ])
  .transform((env) => ({
    keyProvider:
      env.KEY_PROVIDER_ADAPTER === 'secret'
        ? { adapter: env.KEY_PROVIDER_ADAPTER, masterKey: env.MASTER_KEY }
        : { adapter: env.KEY_PROVIDER_ADAPTER },
  }));

export const envSchema = z
  .object({
    APP_ENV: z.enum(['local', 'test', 'production']),
    // The registrable domain the platform runs on: app.<domain> is the main host, every other single
    // label below it an Organisation's subdomain.
    PLATFORM_DOMAIN: z.string().regex(/^[a-z0-9-]+(\.[a-z0-9-]+)*$/, 'must be a bare lowercase hostname'),

    REDIS_URL: z.url(),
    // auto runs queued jobs in this process; manual leaves them queued until a test drains them.
    JOB_WORKER: z.enum(['auto', 'manual']),
  })
  .and(database)
  .and(clock)
  .and(mail)
  .and(fileStorage)
  .and(pdfRenderer)
  .and(paymentGateway)
  .and(keyProvider)
  .superRefine((env, context) => {
    if (env.APP_ENV !== 'production') {
      return;
    }

    if (env.JOB_WORKER !== 'auto') {
      context.addIssue({
        code: 'custom',
        path: ['JOB_WORKER'],
        message: `${env.JOB_WORKER} never runs a job; production requires auto`,
      });
    }

    // The adapter each port must use in production; every other adapter is local or test only.
    const ports = [
      { variable: 'DATABASE_ADAPTER', chosen: env.database.adapter, required: 'neon' },
      { variable: 'CLOCK_ADAPTER', chosen: env.clock.adapter, required: 'system' },
      { variable: 'MAIL_ADAPTER', chosen: env.mail.adapter, required: 'resend' },
      { variable: 'FILE_STORAGE_ADAPTER', chosen: env.fileStorage.adapter, required: 'tigris' },
      { variable: 'PDF_RENDERER_ADAPTER', chosen: env.pdfRenderer.adapter, required: 'gotenberg' },
      { variable: 'PAYMENT_GATEWAY_ADAPTER', chosen: env.paymentGateway.adapter, required: 'comgate' },
      { variable: 'KEY_PROVIDER_ADAPTER', chosen: env.keyProvider.adapter, required: 'secret' },
    ];

    for (const { variable, chosen, required } of ports) {
      if (chosen !== required) {
        context.addIssue({
          code: 'custom',
          path: [variable],
          message: `${chosen} is a local adapter; production requires ${required}`,
        });
      }
    }
  });

export type Env = z.output<typeof envSchema>;
