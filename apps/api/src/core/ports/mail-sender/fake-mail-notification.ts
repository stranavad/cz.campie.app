import { createHmac, timingSafeEqual } from 'node:crypto';
import { z } from 'zod';

import { UNDELIVERABLE_REASONS } from '@repo/schema/emails';

import type { MailNotification, MailNotificationRequest } from './mail-sender.port.ts';

// The local and test adapters' stand-in for the provider's signature. The key is public, which is why
// production refuses both adapters.
const FAKE_KEY = 'campie-fake-mail-notifications';

export const FAKE_SIGNATURE_HEADER = 'x-fake-mail-signature';

const fakeNotificationSchema = z.object({
  reason: z.enum(UNDELIVERABLE_REASONS),
  organisationId: z.uuid(),
  recipients: z.array(z.email()).min(1),
});

/**
 * Sign a fake notification's body, as a test or a local script posts it.
 * @param body the body
 */
export function signFakeMailNotification(body: string | Buffer): string {
  return createHmac('sha256', FAKE_KEY).update(body).digest('hex');
}

/**
 * Read a fake notification: `{ reason, organisationId, recipients }`, signed by signFakeMailNotification.
 * @param request the notification as it arrived
 */
export function readFakeMailNotification({ body, headers }: MailNotificationRequest): MailNotification {
  const signature = headers[FAKE_SIGNATURE_HEADER];
  const expected = Buffer.from(signFakeMailNotification(body));

  if (
    typeof signature !== 'string' ||
    signature.length !== expected.length ||
    !timingSafeEqual(Buffer.from(signature), expected)
  ) {
    return { kind: 'invalid' };
  }

  const parsed = fakeNotificationSchema.safeParse(parseJson(body));

  return parsed.success ? { kind: 'undeliverable', ...parsed.data } : { kind: 'ignored' };
}

/**
 * Parse a body as JSON, or undefined when it is none.
 * @param body the body
 */
export function parseJson(body: Buffer): unknown {
  try {
    return JSON.parse(body.toString('utf8'));
  } catch {
    return undefined;
  }
}
