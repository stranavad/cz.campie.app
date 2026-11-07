import type { UndeliverableReason } from '@repo/schema/emails';

export interface MailAttachment {
  filename: string;
  contentType: string;
  content: Buffer;
  // Set for an image the HTML shows inline as `cid:<contentId>`; mail clients block images in data URLs.
  contentId?: string;
}

export interface MailMessage {
  // An address, optionally with a display name: `Tábor Example <prihlasky@mail.example.test>`.
  from: string;
  to: string[];
  replyTo?: string;
  subject: string;
  html: string;
  text: string;
  attachments: MailAttachment[];
  // The Organisation the message is from, given back by the provider's notifications about it.
  organisationId?: string;
}

// A notification the mail provider posted, as it arrived.
export interface MailNotificationRequest {
  readonly body: Buffer;
  readonly headers: Readonly<Record<string, string | string[] | undefined>>;
}

// What a notification says: forged or stale, of no interest, or that a message of an Organisation could not
// be delivered to its recipients for good.
export type MailNotification =
  | { readonly kind: 'invalid' }
  | { readonly kind: 'ignored' }
  | {
      readonly kind: 'undeliverable';
      readonly reason: UndeliverableReason;
      readonly organisationId: string;
      readonly recipients: readonly string[];
    };

export abstract class MailSender {
  /**
   * Hand a message to the mail provider; rejects when the provider refuses it.
   * @param message the message to send
   */
  public abstract send(message: MailMessage): Promise<void>;

  /**
   * Verify that a notification comes from the mail provider and read it; nothing in it is trusted before.
   * @param request the notification as it arrived
   * @param now the current time, against which a replayed notification is stale
   */
  public abstract readNotification(request: MailNotificationRequest, now: Date): MailNotification;
}
