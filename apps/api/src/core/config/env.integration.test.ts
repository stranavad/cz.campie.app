import { afterEach, describe, expect, it } from 'vitest';

import { bootApp, PRODUCTION_ENV, restoreEnv } from '../../testing/boot-app.ts';

describe('configuration', () => {
  afterEach(restoreEnv);

  it('refuses to boot when a variable the chosen adapter needs is missing', async () => {
    await expect(bootApp({ ...PRODUCTION_ENV, RESEND_API_KEY: undefined })).rejects.toThrow(/RESEND_API_KEY/);
  });

  it('refuses to boot with an unknown adapter', async () => {
    await expect(bootApp({ MAIL_ADAPTER: 'smtp' })).rejects.toThrow(/MAIL_ADAPTER/);
  });

  it('refuses to boot production with a local adapter, naming every one', async () => {
    const boot = bootApp({ ...PRODUCTION_ENV, MAIL_ADAPTER: 'log', PAYMENT_GATEWAY_ADAPTER: 'fake' });

    await expect(boot).rejects.toThrow(/MAIL_ADAPTER: log is a local adapter/);
    await expect(boot).rejects.toThrow(/PAYMENT_GATEWAY_ADAPTER: fake is a local adapter/);
  });
});
