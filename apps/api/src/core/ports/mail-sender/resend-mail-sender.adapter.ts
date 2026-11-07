import { createHmac, timingSafeEqual } from 'node:crypto';
import { Resend } from 'resend';
import { z } from 'zod';

import { parseJson } from './fake-mail-notification.ts';
import {
  MailSender,
  type MailMessage,
  type MailNotification,
  type MailNotificationRequest,
} from './mail-sender.port.ts';

// Resend signs its webhooks the Svix way; a notification older or newer than this is a replay.
const TOLERANCE_MS = 5 * 60 * 1000;
const ORGANISATION_TAG = 'organisation';

// Only what is read of an event; everything else in it is ignored.
const eventSchema = z.object({
  type: z.string(),
  data: z.object({
    to: z.array(z.string()),
    bounce: z.object({ type: z.string() }).optional(),
    // Resend gives the tags back as a record; older events as a list.
    tags: z
      .union([z.record(z.string(), z.string()), z.array(z.object({ name: z.string(), value: z.string() }))])
      .optional(),
  }),
});

export class ResendMailSender extends MailSender {
  private readonly resend: Resend;
  private readonly webhookKey: Buffer;

  constructor(apiKey: string, webhookSecret: string) {
    super();
    this.resend = new Resend(apiKey);
    this.webhookKey = Buffer.from(webhookSecret.replace(/^whsec_/, ''), 'base64');
  }

  public async send({ organisationId, ...message }: MailMessage): Promise<void> {
    // The SDK reports a refusal in the result instead of throwing, so it has to be checked here.
    const { error } = await this.resend.emails.send({
      ...message,
      ...(organisationId === undefined ? {} : { tags: [{ name: ORGANISATION_TAG, value: organisationId }] }),
    });

    if (error) {
      throw new Error(
        `Resend refused the message: ${error.name} (${error.statusCode ?? 'no status'}): ${error.message}`,
      );
    }
  }

  public readNotification({ body, headers }: MailNotificationRequest, now: Date): MailNotification {
    if (!this.isSigned(body, headers, now)) {
      return { kind: 'invalid' };
    }

    const event = eventSchema.safeParse(parseJson(body));

    if (!event.success) {
      return { kind: 'ignored' };
    }

    const { type, data } = event.data;
    // A soft bounce (a full mailbox, a greylisting server) may pass on a later try, so only a hard one counts;
    // a message Resend suppressed was not sent because the address bounced before.
    const reason =
      type === 'email.complained'
        ? 'complaint'
        : (type === 'email.bounced' && data.bounce?.type === 'Permanent') || type === 'email.suppressed'
          ? 'bounce'
          : null;
    const tags = Array.isArray(data.tags)
      ? Object.fromEntries(data.tags.map(({ name, value }) => [name, value]))
      : (data.tags ?? {});
    const organisationId = z.uuid().safeParse(tags[ORGANISATION_TAG]);

    // The event names every recipient of the message, so one of several cannot be told from the rest.
    if (reason === null || !organisationId.success || data.to.length !== 1) {
      return { kind: 'ignored' };
    }

    return { kind: 'undeliverable', reason, organisationId: organisationId.data, recipients: data.to };
  }

  /**
   * Check the Svix signature of a notification and that its timestamp is recent.
   * @param body the raw body
   * @param headers its headers
   * @param now the current time
   */
  private isSigned(body: Buffer, headers: MailNotificationRequest['headers'], now: Date): boolean {
    const id = headers['svix-id'];
    const timestamp = headers['svix-timestamp'];
    const signatures = headers['svix-signature'];

    if (typeof id !== 'string' || typeof timestamp !== 'string' || typeof signatures !== 'string') {
      return false;
    }

    const sentAt = Number(timestamp) * 1000;

    if (!Number.isFinite(sentAt) || Math.abs(now.getTime() - sentAt) > TOLERANCE_MS) {
      return false;
    }

    const expected = createHmac('sha256', this.webhookKey).update(`${id}.${timestamp}.`).update(body).digest();

    return signatures.split(' ').some((entry) => {
      const [version, signature] = entry.split(',');
      const given = Buffer.from(signature ?? '', 'base64');

      return version === 'v1' && given.length === expected.length && timingSafeEqual(given, expected);
    });
  }
}
