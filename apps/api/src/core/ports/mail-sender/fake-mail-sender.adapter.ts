import { readFakeMailNotification } from './fake-mail-notification.ts';
import {
  MailSender,
  type MailMessage,
  type MailNotification,
  type MailNotificationRequest,
} from './mail-sender.port.ts';

// Test only: keeps every message so a test can read what the app sent. Production refuses it.
export class FakeMailSender extends MailSender {
  public readonly sent: MailMessage[] = [];

  public send(message: MailMessage): Promise<void> {
    // A structured clone would turn the attachments' Buffers into plain byte arrays.
    this.sent.push({
      ...structuredClone({ ...message, attachments: [] }),
      attachments: message.attachments.map((attachment) => ({
        ...attachment,
        content: Buffer.from(attachment.content),
      })),
    });

    return Promise.resolve();
  }

  public readNotification(request: MailNotificationRequest): MailNotification {
    return readFakeMailNotification(request);
  }
}
