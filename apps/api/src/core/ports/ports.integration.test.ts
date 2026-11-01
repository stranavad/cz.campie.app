import type { INestApplication } from '@nestjs/common';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { bootApp, PRODUCTION_ENV, restoreEnv } from '../../testing/boot-app.ts';
import { Clock } from './clock/clock.port.ts';
import { ControllableClock } from './clock/controllable-clock.adapter.ts';
import { SystemClock } from './clock/system-clock.adapter.ts';
import { FileStorage } from './file-storage/file-storage.port.ts';
import { MemoryFileStorage } from './file-storage/memory-file-storage.adapter.ts';
import { TigrisFileStorage } from './file-storage/tigris-file-storage.adapter.ts';
import { FixedKeyProvider } from './key-provider/fixed-key-provider.adapter.ts';
import { KeyProvider } from './key-provider/key-provider.port.ts';
import { SecretKeyProvider } from './key-provider/secret-key-provider.adapter.ts';
import { FakeMailSender } from './mail-sender/fake-mail-sender.adapter.ts';
import { MailSender } from './mail-sender/mail-sender.port.ts';
import { ResendMailSender } from './mail-sender/resend-mail-sender.adapter.ts';
import { ComgatePaymentGateway } from './payment-gateway/comgate-payment-gateway.adapter.ts';
import { FakePaymentGateway } from './payment-gateway/fake-payment-gateway.adapter.ts';
import { PaymentGateway } from './payment-gateway/payment-gateway.port.ts';
import { FakePdfRenderer } from './pdf-renderer/fake-pdf-renderer.adapter.ts';
import { GotenbergPdfRenderer } from './pdf-renderer/gotenberg-pdf-renderer.adapter.ts';
import { PdfRenderer } from './pdf-renderer/pdf-renderer.port.ts';

describe('ports', () => {
  let app: INestApplication | undefined;

  afterEach(async () => {
    await app?.close();
    app = undefined;
    restoreEnv();
    vi.restoreAllMocks();
  });

  it('wires every port to its production adapter in production', async () => {
    app = await bootApp({ env: PRODUCTION_ENV });

    expect(app.get(Clock)).toBeInstanceOf(SystemClock);
    expect(app.get(MailSender)).toBeInstanceOf(ResendMailSender);
    expect(app.get(FileStorage)).toBeInstanceOf(TigrisFileStorage);
    expect(app.get(PdfRenderer)).toBeInstanceOf(GotenbergPdfRenderer);
    expect(app.get(PaymentGateway)).toBeInstanceOf(ComgatePaymentGateway);
    expect(app.get(KeyProvider)).toBeInstanceOf(SecretKeyProvider);
  });

  it('wires every port to its fake in the test configuration', async () => {
    app = await bootApp();

    expect(app.get(Clock)).toBeInstanceOf(ControllableClock);
    expect(app.get(MailSender)).toBeInstanceOf(FakeMailSender);
    expect(app.get(FileStorage)).toBeInstanceOf(MemoryFileStorage);
    expect(app.get(PdfRenderer)).toBeInstanceOf(FakePdfRenderer);
    expect(app.get(PaymentGateway)).toBeInstanceOf(FakePaymentGateway);
    expect(app.get(KeyProvider)).toBeInstanceOf(FixedKeyProvider);
  });

  it('writes local mail to the log in full and sends it nowhere', async () => {
    const logged: string[] = [];
    const record = (message: unknown) => {
      logged.push(String(message));
    };
    app = await bootApp({ env: { MAIL_ADAPTER: 'log' }, logger: { log: record, error: record, warn: record } });
    const fetchSpy = vi.spyOn(globalThis, 'fetch');

    await app.get(MailSender).send({
      from: 'Tábor Example <prihlasky@mail.example.test>',
      to: ['jana.testova@example.test', 'petr.testovy@example.test'],
      replyTo: 'vedouci@example.test',
      subject: 'Potvrzení přihlášky',
      html: '<p>Děkujeme za přihlášku.</p>',
      text: 'Děkujeme za přihlášku.',
    });

    const mail = logged.find((entry) => entry.includes('Potvrzení přihlášky'));
    expect(mail).toContain('To: jana.testova@example.test, petr.testovy@example.test');
    expect(mail).toContain('Subject: Potvrzení přihlášky');
    expect(mail).toContain('Děkujeme za přihlášku.');
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('has only a Comgate stub, which refuses every call', async () => {
    app = await bootApp({ env: PRODUCTION_ENV });
    const credentials = { merchantId: '123456', secret: 'dummy' };

    await expect(
      app.get(PaymentGateway).createPayment({
        credentials,
        referenceId: '0190d6c2-7a1e-7000-8000-000000000001',
        amountCzk: 4200,
        label: 'Turnus 1',
        email: 'guardian@example.test',
      }),
    ).rejects.toThrow('not implemented');
    await expect(app.get(PaymentGateway).getPaymentStatus(credentials, 'fake-transaction')).rejects.toThrow(
      'not implemented',
    );
  });
});
