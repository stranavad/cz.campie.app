import { MailSender, type MailMessage } from './mail-sender.port.ts';

// Test only: keeps every message so a test can read what the app sent. Production refuses it.
export class FakeMailSender extends MailSender {
  public readonly sent: MailMessage[] = [];

  public send(message: MailMessage): Promise<void> {
    this.sent.push(structuredClone(message));

    return Promise.resolve();
  }
}
