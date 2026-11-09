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
    z.object({
      MAIL_ADAPTER: z.literal('resend'),
      RESEND_API_KEY: nonEmpty,
      // The webhook's signing secret as Resend shows it: whsec_ and at least 24 bytes in base64.
      RESEND_WEBHOOK_SECRET: z.string().regex(/^whsec_[A-Za-z0-9+/]{32,}={0,2}$/),
    }),
    z.object({ MAIL_ADAPTER: z.enum(['log', 'fake']) }),
  ])
  .transform((env) => ({
    mail:
      env.MAIL_ADAPTER === 'resend'
        ? { adapter: env.MAIL_ADAPTER, apiKey: env.RESEND_API_KEY, webhookSecret: env.RESEND_WEBHOOK_SECRET }
        : { adapter: env.MAIL_ADAPTER },
  }));

// Mail goes from the platform's domain on two streams, each on its own subdomain: login links, email
// verification and invitations on auth, everything else on notification, so bulk mail's reputation never
// holds back a login.
const mailStreams = z
  .object({ MAIL_AUTH_FROM: z.email(), MAIL_NOTIFICATION_FROM: z.email() })
  .refine((env) => domainOf(env.MAIL_AUTH_FROM) !== domainOf(env.MAIL_NOTIFICATION_FROM), {
    path: ['MAIL_NOTIFICATION_FROM'],
    message: 'must be on another domain than MAIL_AUTH_FROM',
  })
  .transform((env) => ({ mailStreams: { auth: env.MAIL_AUTH_FROM, notification: env.MAIL_NOTIFICATION_FROM } }));

function domainOf(address: string): string {
  return address.slice(address.lastIndexOf('@') + 1).toLowerCase();
}

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
    z.object({
      PAYMENT_GATEWAY_ADAPTER: z.literal('comgate'),
      // Comgate test payments, for a staging deployment against Organisations' test accounts.
      COMGATE_TEST_PAYMENTS: z.enum(['true', 'false']).default('false'),
    }),
    z.object({ PAYMENT_GATEWAY_ADAPTER: z.literal('fake') }),
  ])
  .transform((env) => ({
    paymentGateway:
      env.PAYMENT_GATEWAY_ADAPTER === 'comgate'
        ? { adapter: env.PAYMENT_GATEWAY_ADAPTER, testPayments: env.COMGATE_TEST_PAYMENTS === 'true' }
        : { adapter: env.PAYMENT_GATEWAY_ADAPTER },
  }));

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

const positiveInteger = z.coerce.number().int().positive();

// Failed admin logins: each email and each IP address may fail this often within the lockout period, and
// then waits until its oldest failure is that long ago. An IP address is shared by an office or a camp's
// wifi, so its limit is the higher one.
const loginLimits = z
  .object({
    LOGIN_MAX_FAILURES_PER_ACCOUNT: positiveInteger,
    LOGIN_MAX_FAILURES_PER_IP: positiveInteger,
    LOGIN_LOCKOUT_MINUTES: positiveInteger,
  })
  .transform((env) => ({
    loginLimits: {
      perAccount: env.LOGIN_MAX_FAILURES_PER_ACCOUNT,
      perIp: env.LOGIN_MAX_FAILURES_PER_IP,
      lockoutMs: env.LOGIN_LOCKOUT_MINUTES * 60 * 1000,
    },
  }));

// Anonymous requests that send mail or create data: each IP address and each target (the email a request
// is for) may make this many of a kind within the window, counted apart per kind. An IP address is shared
// by an office or a camp's wifi, so its limit is the higher one. Failed attempts count too, so a signer
// correcting the form a few times needs room under the email's limit.
const requestLimits = z
  .object({
    REQUEST_LIMIT_WINDOW_MINUTES: positiveInteger,
    SIGNUP_LIMIT_PER_IP: positiveInteger,
    SIGNUP_LIMIT_PER_EMAIL: positiveInteger,
    PASSWORD_RESET_LIMIT_PER_IP: positiveInteger,
    PASSWORD_RESET_LIMIT_PER_EMAIL: positiveInteger,
    PRICE_PREVIEW_LIMIT_PER_IP: positiveInteger,
    PRICE_PREVIEW_LIMIT_PER_ORGANISATION: positiveInteger,
    SUBMISSION_LIMIT_PER_IP: positiveInteger,
    SUBMISSION_LIMIT_PER_ORGANISATION: positiveInteger,
    LOGIN_LINK_LIMIT_PER_IP: positiveInteger,
    LOGIN_LINK_LIMIT_PER_EMAIL: positiveInteger,
    GATEWAY_NOTIFICATION_LIMIT_PER_IP: positiveInteger,
    GATEWAY_NOTIFICATION_LIMIT_PER_ORGANISATION: positiveInteger,
    CARD_PAYMENT_LIMIT_PER_IP: positiveInteger,
    CARD_PAYMENT_LIMIT_PER_ORGANISATION: positiveInteger,
    PAYMENT_REMINDER_LIMIT_PER_ORGANISATION: positiveInteger,
    GUARDIAN_ACTION_LIMIT_PER_IP: positiveInteger,
    GUARDIAN_ACTION_LIMIT_PER_EMAIL: positiveInteger,
    PROBLEM_REPORT_LIMIT_PER_IP: positiveInteger,
    PROBLEM_REPORT_LIMIT_PER_TARGET: positiveInteger,
    TEST_EMAIL_LIMIT_PER_IP: positiveInteger,
    TEST_EMAIL_LIMIT_PER_ADMIN: positiveInteger,
  })
  .transform((env) => {
    const windowMs = env.REQUEST_LIMIT_WINDOW_MINUTES * 60 * 1000;
    const limitOf = (name: string, perIp: number, perTarget: number) => ({
      ip: { name: `${name}-ip`, max: perIp, windowMs },
      target: { name: `${name}-target`, max: perTarget, windowMs },
    });

    return {
      requestLimits: {
        signup: limitOf('signup', env.SIGNUP_LIMIT_PER_IP, env.SIGNUP_LIMIT_PER_EMAIL),
        passwordReset: limitOf('password-reset', env.PASSWORD_RESET_LIMIT_PER_IP, env.PASSWORD_RESET_LIMIT_PER_EMAIL),
        // A form asks again as it is filled in, so the price preview allows many; its target is the
        // Organisation, so a flood from many addresses still stops.
        pricePreview: limitOf(
          'price-preview',
          env.PRICE_PREVIEW_LIMIT_PER_IP,
          env.PRICE_PREVIEW_LIMIT_PER_ORGANISATION,
        ),
        // Per Organisation well above a popular Camp's opening rush, which may bring hundreds within minutes.
        submission: limitOf('submission', env.SUBMISSION_LIMIT_PER_IP, env.SUBMISSION_LIMIT_PER_ORGANISATION),
        loginLink: limitOf('login-link', env.LOGIN_LINK_LIMIT_PER_IP, env.LOGIN_LINK_LIMIT_PER_EMAIL),
        // Each notification makes a call to Comgate. Comgate notifies every Organisation from a few
        // addresses, so the address's limit is far above the Organisation's.
        gatewayNotification: limitOf(
          'gateway-notification',
          env.GATEWAY_NOTIFICATION_LIMIT_PER_IP,
          env.GATEWAY_NOTIFICATION_LIMIT_PER_ORGANISATION,
        ),
        // Starting a card payment and showing how one ended each make a call to Comgate.
        cardPayment: limitOf('card-payment', env.CARD_PAYMENT_LIMIT_PER_IP, env.CARD_PAYMENT_LIMIT_PER_ORGANISATION),
        // Counted apart, so the result page's polling never uses up the starts.
        cardPaymentResult: limitOf(
          'card-payment-result',
          env.CARD_PAYMENT_LIMIT_PER_IP,
          env.CARD_PAYMENT_LIMIT_PER_ORGANISATION,
        ),
        // An admin's bulk reminder, counted per Organisation only: each may email hundreds of guardians.
        paymentReminder: limitOf(
          'payment-reminder',
          env.PAYMENT_REMINDER_LIMIT_PER_ORGANISATION,
          env.PAYMENT_REMINDER_LIMIT_PER_ORGANISATION,
        ),
        // A signed guardian's actions that store files and send mail: signing a Consent, handing in a document.
        guardianAction: limitOf(
          'guardian-action',
          env.GUARDIAN_ACTION_LIMIT_PER_IP,
          env.GUARDIAN_ACTION_LIMIT_PER_EMAIL,
        ),
        // Feedback and problem reports to the Platform operator: per address, and per admin or Organisation.
        problemReport: limitOf('problem-report', env.PROBLEM_REPORT_LIMIT_PER_IP, env.PROBLEM_REPORT_LIMIT_PER_TARGET),
        // An admin's test email of a Camp's text, to their own address: per address and per admin.
        testEmail: limitOf('test-email', env.TEST_EMAIL_LIMIT_PER_IP, env.TEST_EMAIL_LIMIT_PER_ADMIN),
        // The open-items reminder, as often as the payment reminder, counted apart.
        openItemsReminder: limitOf(
          'open-items-reminder',
          env.PAYMENT_REMINDER_LIMIT_PER_ORGANISATION,
          env.PAYMENT_REMINDER_LIMIT_PER_ORGANISATION,
        ),
      },
    };
  });

/**
 * Tell whether an environment is deployed: it reads no env file and needs every production adapter.
 * @param appEnv the value of APP_ENV
 */
export function isDeployment(appEnv: string | undefined): appEnv is 'staging' | 'production' {
  return appEnv === 'staging' || appEnv === 'production';
}

export const envSchema = z
  .object({
    // staging is a deployed copy of production that takes no live payments.
    APP_ENV: z.enum(['local', 'test', 'staging', 'production']),
    // The registrable domain the platform runs on: app.<domain> is the main host, every other single
    // label below it an Organisation's subdomain.
    PLATFORM_DOMAIN: z.string().regex(/^[a-z0-9-]+(\.[a-z0-9-]+)*$/, 'must be a bare lowercase hostname'),
    // How emailed links reach the platform: https everywhere but the local stack.
    PLATFORM_SCHEME: z.enum(['https', 'http']),
    // The platform's name: the sender of its own mail, and a subdomain no Organisation may take.
    PRODUCT_NAME: nonEmpty,
    // Where the Platform operator is told of new signups and problem reports.
    PLATFORM_OPERATOR_EMAIL: z.email(),
    // Where guardians write about a technical problem with the platform.
    PLATFORM_SUPPORT_EMAIL: z.email(),

    // The frontend's proxy sends this secret with every request; when set, a request without it is refused
    // before anything else runs, so nobody can call the API past the proxy with a forged X-Forwarded-For.
    PROXY_SECRET: z
      .string()
      .regex(/^[\x21-\x7e]{32,}$/, 'must be at least 32 printable ASCII characters without spaces')
      .optional(),
    // How many proxies in front of the API append to X-Forwarded-For: the client's address is the entry
    // this many places from the end. 0 trusts no proxy and takes the connection's peer; 1 is the dev
    // server's proxy.
    TRUST_PROXY_HOPS: z.coerce.number().int().nonnegative().default(1),

    REDIS_URL: z.url(),
    // auto runs queued jobs in this process; manual leaves them queued until a test drains them.
    JOB_WORKER: z.enum(['auto', 'manual']),
  })
  .and(database)
  .and(clock)
  .and(mail)
  .and(mailStreams)
  .and(fileStorage)
  .and(pdfRenderer)
  .and(paymentGateway)
  .and(keyProvider)
  .and(loginLimits)
  .and(requestLimits)
  .superRefine((env, context) => {
    if (!isDeployment(env.APP_ENV)) {
      return;
    }

    const deployment = env.APP_ENV;

    if (env.JOB_WORKER !== 'auto') {
      context.addIssue({
        code: 'custom',
        path: ['JOB_WORKER'],
        message: `${env.JOB_WORKER} never runs a job; ${deployment} requires auto`,
      });
    }

    if (env.PLATFORM_SCHEME !== 'https') {
      context.addIssue({ code: 'custom', path: ['PLATFORM_SCHEME'], message: `${deployment} requires https` });
    }

    if (env.PROXY_SECRET === undefined) {
      context.addIssue({
        code: 'custom',
        path: ['PROXY_SECRET'],
        message: `${deployment} requires the secret the frontend's proxy sends`,
      });
    }

    // The adapter each port must use when deployed; every other adapter is local or test only.
    const ports = [
      { variable: 'DATABASE_ADAPTER', chosen: env.database.adapter, required: 'neon' },
      { variable: 'CLOCK_ADAPTER', chosen: env.clock.adapter, required: 'system' },
      { variable: 'MAIL_ADAPTER', chosen: env.mail.adapter, required: 'resend' },
      { variable: 'FILE_STORAGE_ADAPTER', chosen: env.fileStorage.adapter, required: 'tigris' },
      { variable: 'PDF_RENDERER_ADAPTER', chosen: env.pdfRenderer.adapter, required: 'gotenberg' },
      { variable: 'KEY_PROVIDER_ADAPTER', chosen: env.keyProvider.adapter, required: 'secret' },
      // Production takes only live card payments and staging never does: a staging copy tests with the
      // fake gateway or Comgate's test payments, so nobody pays real money there.
      ...(deployment === 'production'
        ? [{ variable: 'PAYMENT_GATEWAY_ADAPTER', chosen: env.paymentGateway.adapter, required: 'comgate' }]
        : []),
    ];

    for (const { variable, chosen, required } of ports) {
      if (chosen !== required) {
        context.addIssue({
          code: 'custom',
          path: [variable],
          message: `${chosen} is a local adapter; ${deployment} requires ${required}`,
        });
      }
    }

    const payments = env.paymentGateway;

    if (deployment === 'production' && payments.adapter === 'comgate' && payments.testPayments) {
      context.addIssue({
        code: 'custom',
        path: ['COMGATE_TEST_PAYMENTS'],
        message: 'production takes only live payments; test payments are for staging',
      });
    }

    if (deployment === 'staging' && payments.adapter === 'comgate' && !payments.testPayments) {
      context.addIssue({
        code: 'custom',
        path: ['COMGATE_TEST_PAYMENTS'],
        message: 'staging takes no live payments; set it to true or use the fake adapter',
      });
    }
  });

export type Env = z.output<typeof envSchema>;
