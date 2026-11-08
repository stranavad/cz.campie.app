import { afterEach, describe, expect, it } from 'vitest';

import { bootApp, PRODUCTION_ENV, restoreEnv } from '../../testing/boot-app.ts';

describe('configuration', () => {
  afterEach(restoreEnv);

  it('refuses to boot when a variable the chosen adapter needs is missing', async () => {
    await expect(bootApp({ env: { ...PRODUCTION_ENV, RESEND_API_KEY: undefined } })).rejects.toThrow(/RESEND_API_KEY/);
  });

  it('refuses to boot with an unknown adapter', async () => {
    await expect(bootApp({ env: { MAIL_ADAPTER: 'smtp' } })).rejects.toThrow(/MAIL_ADAPTER/);
  });

  it('refuses to boot with both mail streams on one domain, which would share their reputation', async () => {
    await expect(
      bootApp({ env: { MAIL_AUTH_FROM: 'prihlaseni@campie.test', MAIL_NOTIFICATION_FROM: 'info@CAMPIE.test' } }),
    ).rejects.toThrow(/MAIL_NOTIFICATION_FROM: must be on another domain than MAIL_AUTH_FROM/);
  });

  it('refuses to boot production with a local adapter, naming every one', async () => {
    const boot = bootApp({ env: { ...PRODUCTION_ENV, MAIL_ADAPTER: 'log', PAYMENT_GATEWAY_ADAPTER: 'fake' } });

    await expect(boot).rejects.toThrow(/MAIL_ADAPTER: log is a local adapter/);
    await expect(boot).rejects.toThrow(/PAYMENT_GATEWAY_ADAPTER: fake is a local adapter/);
  });

  it('refuses to boot production with a job worker that never runs a job', async () => {
    await expect(bootApp({ env: { ...PRODUCTION_ENV, JOB_WORKER: 'manual' } })).rejects.toThrow(
      /JOB_WORKER: manual never runs a job/,
    );
  });

  it('refuses to boot production with Comgate test payments, which would record no live payment', async () => {
    await expect(bootApp({ env: { ...PRODUCTION_ENV, COMGATE_TEST_PAYMENTS: 'true' } })).rejects.toThrow(
      /COMGATE_TEST_PAYMENTS: production takes only live payments/,
    );
  });

  it('refuses to boot staging with live payments', async () => {
    await expect(bootApp({ env: { ...PRODUCTION_ENV, APP_ENV: 'staging' } })).rejects.toThrow(
      /COMGATE_TEST_PAYMENTS: staging takes no live payments/,
    );
  });

  it.each([{ COMGATE_TEST_PAYMENTS: 'true' }, { PAYMENT_GATEWAY_ADAPTER: 'fake' }])(
    'boots staging with %o',
    async (payments) => {
      const app = await bootApp({ env: { ...PRODUCTION_ENV, APP_ENV: 'staging', ...payments } });

      await expect(app.close()).resolves.toBeUndefined();
    },
  );

  it('refuses to boot staging with a local adapter, as production does', async () => {
    await expect(
      bootApp({ env: { ...PRODUCTION_ENV, APP_ENV: 'staging', COMGATE_TEST_PAYMENTS: 'true', MAIL_ADAPTER: 'log' } }),
    ).rejects.toThrow(/MAIL_ADAPTER: log is a local adapter; staging requires resend/);
  });

  it('refuses to boot a deployment without the proxy secret, or with a short one', async () => {
    await expect(bootApp({ env: { ...PRODUCTION_ENV, PROXY_SECRET: undefined } })).rejects.toThrow(
      /PROXY_SECRET: production requires the secret/,
    );
    await expect(bootApp({ env: { ...PRODUCTION_ENV, PROXY_SECRET: 'too-short' } })).rejects.toThrow(
      /PROXY_SECRET: must be at least 32 printable ASCII characters/,
    );
  });
});
