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
      attachments: [],
    });

    const mail = logged.find((entry) => entry.includes('Potvrzení přihlášky'));
    expect(mail).toContain('To: jana.testova@example.test, petr.testovy@example.test');
    expect(mail).toContain('Subject: Potvrzení přihlášky');
    expect(mail).toContain('Děkujeme za přihlášku.');
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('creates a Comgate payment with the account it is given, in haléře', async () => {
    app = await bootApp({ env: PRODUCTION_ENV });
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      Response.json({
        code: 0,
        message: 'OK',
        transId: 'AB12-CD34-EF56',
        redirect: 'https://payments.comgate.cz/client/instructions/index?id=AB12-CD34-EF56',
      }),
    );

    const created = await app.get(PaymentGateway).createPayment({
      credentials: { merchantId: '123456', secret: 'not-a-real-secret' },
      referenceId: '0190d6c2-7a1e-7000-8000-000000000001',
      amountCzk: 4200,
      label: 'VS 27123456',
      email: 'guardian@example.test',
      returnUrl: 'https://tabor.example.test/platba?id=${id}',
    });

    const [url, init] = fetchSpy.mock.calls[0] ?? [];
    expect(url).toBe('https://payments.comgate.cz/v2.0/payment.json');
    expect(new Headers(init?.headers).get('authorization')).toBe(
      `Basic ${Buffer.from('123456:not-a-real-secret').toString('base64')}`,
    );
    expect(JSON.parse(typeof init?.body === 'string' ? init.body : '')).toMatchObject({
      price: 420_000,
      curr: 'CZK',
      test: false,
      refId: '0190d6c2-7a1e-7000-8000-000000000001',
    });
    expect(created).toEqual({
      transactionId: 'AB12-CD34-EF56',
      redirectUrl: 'https://payments.comgate.cz/client/instructions/index?id=AB12-CD34-EF56',
    });
  });

  it('refuses a Comgate redirect anywhere but its payment pages', async () => {
    app = await bootApp({ env: PRODUCTION_ENV });
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      Response.json({ code: 0, transId: 'AB12-CD34-EF56', redirect: 'https://payments.example.test/pay' }),
    );

    await expect(
      app.get(PaymentGateway).createPayment({
        credentials: { merchantId: '123456', secret: 'not-a-real-secret' },
        referenceId: '0190d6c2-7a1e-7000-8000-000000000001',
        amountCzk: 4200,
        label: 'VS 27123456',
        email: 'guardian@example.test',
        returnUrl: 'https://tabor.example.test/platba?id=${id}',
      }),
    ).rejects.toThrow('refused');
  });

  it('reads a Comgate transaction, knows none the account does not, and fails when Comgate does', async () => {
    app = await bootApp({ env: PRODUCTION_ENV });
    const credentials = { merchantId: '123456', secret: 'not-a-real-secret' };
    const paid = {
      code: 0,
      transId: 'AB12-CD34-EF56',
      status: 'PAID',
      refId: 'ref',
      price: '420000',
      curr: 'CZK',
      test: false,
    };
    const fetchSpy = vi.spyOn(globalThis, 'fetch');

    fetchSpy.mockResolvedValueOnce(Response.json(paid));
    expect(await app.get(PaymentGateway).getPayment(credentials, 'AB12-CD34-EF56')).toEqual({
      transactionId: 'AB12-CD34-EF56',
      status: 'paid',
      referenceId: 'ref',
      amountCzk: 4200,
    });

    fetchSpy.mockResolvedValueOnce(Response.json({ ...paid, test: true }));
    expect(await app.get(PaymentGateway).getPayment(credentials, 'AB12-CD34-EF56')).toBeNull();

    fetchSpy.mockResolvedValueOnce(Response.json({ code: 1400, message: 'Unknown' }, { status: 400 }));
    expect(await app.get(PaymentGateway).getPayment(credentials, 'AB12-CD34-EF56')).toBeNull();

    fetchSpy.mockResolvedValueOnce(Response.json({ ...paid, price: '420050' }));
    await expect(app.get(PaymentGateway).getPayment(credentials, 'AB12-CD34-EF56')).rejects.toThrow('unexpected shape');

    fetchSpy.mockResolvedValueOnce(new Response('', { status: 503 }));
    await expect(app.get(PaymentGateway).getPayment(credentials, 'AB12-CD34-EF56')).rejects.toThrow('HTTP 503');
  });
});
