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
}

export abstract class MailSender {
  /**
   * Hand a message to the mail provider; rejects when the provider refuses it.
   * @param message the message to send
   */
  public abstract send(message: MailMessage): Promise<void>;
}
