import { Resend } from 'resend';

import { MailSender, type MailMessage } from './mail-sender.port.ts';

export class ResendMailSender extends MailSender {
  private readonly resend: Resend;

  constructor(apiKey: string) {
    super();
    this.resend = new Resend(apiKey);
  }

  public async send(message: MailMessage): Promise<void> {
    // The SDK reports a refusal in the result instead of throwing, so it has to be checked here.
    const { error } = await this.resend.emails.send(message);

    if (error) {
      throw new Error(
        `Resend refused the message: ${error.name} (${error.statusCode ?? 'no status'}): ${error.message}`,
      );
    }
  }
}
