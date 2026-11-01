import { Readable } from 'node:stream';
import { text } from 'node:stream/consumers';
import { describe, expect, it } from 'vitest';

import { FileStorage } from '../core/ports/file-storage/file-storage.port.ts';
import { MailSender } from '../core/ports/mail-sender/mail-sender.port.ts';
import { PaymentGateway } from '../core/ports/payment-gateway/payment-gateway.port.ts';
import { PdfRenderer } from '../core/ports/pdf-renderer/pdf-renderer.port.ts';
import { useTestApp } from './test-app.ts';

describe('test app', () => {
  const { app, http, database, mail, files, payments, pdfs } = useTestApp();

  it('boots the real app over HTTP against its own database, as the application role', async () => {
    const response = await http().get('/api/health');

    expect(response.body.services.database).toBe('up');
    expect(new URL(database().appUrl).username).toBe('campie_app');
  });

  it('captures mail instead of sending it', async () => {
    const message = {
      from: 'Tábor Example <prihlasky@mail.example.test>',
      to: ['jana.testova@example.test'],
      subject: 'Potvrzení přihlášky',
      html: '<p>Děkujeme.</p>',
      text: 'Děkujeme.',
    };

    await app().get(MailSender).send(message);

    expect(mail().sent).toEqual([message]);
  });

  it('keeps stored files in memory, readable back by key', async () => {
    const storage = app().get(FileStorage);

    await storage.put('documents/a', Readable.from([Buffer.from('ciphertext')]), 10);

    expect(files().objects.get('documents/a')).toEqual(Buffer.from('ciphertext'));
    expect(await text(await storage.get('documents/a'))).toBe('ciphertext');
    await storage.delete('documents/a');
    expect(await storage.exists('documents/a')).toBe(false);
    await expect(storage.get('documents/a')).rejects.toThrow('documents/a');
  });

  it('refuses a file whose length differs from the one declared, as S3 does', async () => {
    await expect(
      app()
        .get(FileStorage)
        .put('documents/a', Readable.from([Buffer.from('abc')]), 4),
    ).rejects.toThrow(/3 bytes/);
    expect(files().objects.size).toBe(0);
  });

  it('records the payments created at the gateway', async () => {
    const input = {
      credentials: { merchantId: '123456', secret: 'dummy' },
      referenceId: '0190d6c2-7a1e-7000-8000-000000000001',
      amountCzk: 4200,
      label: 'Turnus 1',
      email: 'guardian@example.test',
    };

    const created = await app().get(PaymentGateway).createPayment(input);

    expect(payments().created).toEqual([{ input, ...created }]);
  });

  it('records the HTML of every rendered PDF', async () => {
    await app().get(PdfRenderer).render('<h1>Přihláška</h1>');

    expect(pdfs().rendered).toEqual(['<h1>Přihláška</h1>']);
  });
});
