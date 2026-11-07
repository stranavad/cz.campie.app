import { createHmac } from 'node:crypto';
import { describe, expect, it } from 'vitest';

import { ResendMailSender } from './resend-mail-sender.adapter.ts';

// A made-up signing secret, as Resend shows one.
const KEY = Buffer.from('test-only-webhook-signing-secret');
const SECRET = `whsec_${KEY.toString('base64')}`;
const ORGANISATION = '01900000-0000-7000-8000-0000000000aa';
const NOW = new Date('2026-11-07T12:00:00Z');

const sender = new ResendMailSender('re_test', SECRET);

/**
 * Sign a body the way Resend's webhooks do (Svix): HMAC-SHA256 of `id.timestamp.body`, base64, after `v1,`.
 */
function signed(event: object, { at = NOW, key = KEY, id = 'msg_test' } = {}) {
  const body = Buffer.from(JSON.stringify(event));
  const timestamp = String(Math.floor(at.getTime() / 1000));
  const signature = createHmac('sha256', key).update(`${id}.${timestamp}.`).update(body).digest('base64');

  return {
    body,
    headers: { 'svix-id': id, 'svix-timestamp': timestamp, 'svix-signature': `v1,bogus v1,${signature}` },
  };
}

const bounced = (bounceType: string, to = ['jana.testovaci@example.com']) => ({
  type: 'email.bounced',
  created_at: NOW.toISOString(),
  data: { email_id: 'e_1', to, tags: { organisation: ORGANISATION }, bounce: { type: bounceType, subType: 'General' } },
});

describe('Resend notifications', () => {
  it('reads a signed hard bounce of the Organisation the message was tagged with', () => {
    expect(sender.readNotification(signed(bounced('Permanent')), NOW)).toEqual({
      kind: 'undeliverable',
      reason: 'bounce',
      organisationId: ORGANISATION,
      recipients: ['jana.testovaci@example.com'],
    });
  });

  it('reads a complaint, with the tags given as a list', () => {
    const complaint = {
      type: 'email.complained',
      data: { to: ['jana.testovaci@example.com'], tags: [{ name: 'organisation', value: ORGANISATION }] },
    };

    expect(sender.readNotification(signed(complaint), NOW)).toMatchObject({
      kind: 'undeliverable',
      reason: 'complaint',
    });
  });

  it('refuses a wrong key, an altered body and a stale timestamp', () => {
    const altered = signed(bounced('Permanent'));
    altered.body = Buffer.from(altered.body.toString().replace('jana', 'petr'));

    expect(sender.readNotification(signed(bounced('Permanent'), { key: Buffer.from('another') }), NOW)).toEqual({
      kind: 'invalid',
    });
    expect(sender.readNotification(altered, NOW)).toEqual({ kind: 'invalid' });
    expect(
      sender.readNotification(signed(bounced('Permanent'), { at: new Date(NOW.getTime() - 6 * 60 * 1000) }), NOW),
    ).toEqual({ kind: 'invalid' });
    expect(sender.readNotification({ body: Buffer.from('{}'), headers: {} }, NOW)).toEqual({ kind: 'invalid' });
  });

  it('ignores a soft bounce, a message of several recipients and one without its Organisation', () => {
    const untagged = { type: 'email.bounced', data: { to: ['a@example.com'], bounce: { type: 'Permanent' } } };

    expect(sender.readNotification(signed(bounced('Transient')), NOW)).toEqual({ kind: 'ignored' });
    expect(sender.readNotification(signed(bounced('Permanent', ['a@example.com', 'b@example.com'])), NOW)).toEqual({
      kind: 'ignored',
    });
    expect(sender.readNotification(signed(untagged), NOW)).toEqual({ kind: 'ignored' });
  });
});
