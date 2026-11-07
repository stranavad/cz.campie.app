import { Logger } from '@nestjs/common';

import { readFakeMailNotification } from './fake-mail-notification.ts';
import {
  MailSender,
  type MailMessage,
  type MailNotification,
  type MailNotificationRequest,
} from './mail-sender.port.ts';

// Local only: production requires Resend. The whole message is logged so it can be read during
// local testing, which is why this adapter, unlike the rest of the app, logs addresses and content.
export class LogMailSender extends MailSender {
  private readonly logger = new Logger(LogMailSender.name);

  public async send(message: MailMessage): Promise<void> {
    const headers = [
      `From: ${message.from}`,
      `To: ${message.to.join(', ')}`,
      ...(message.replyTo === undefined ? [] : [`Reply-To: ${message.replyTo}`]),
      `Subject: ${message.subject}`,
      ...message.attachments.map(
        ({ filename, contentType, content }) => `Attachment: ${filename} (${contentType}, ${content.length} B)`,
      ),
    ];

    this.logger.log([...headers, '', message.text, '', message.html].join('\n'));
  }

  public readNotification(request: MailNotificationRequest): MailNotification {
    return readFakeMailNotification(request);
  }
}
