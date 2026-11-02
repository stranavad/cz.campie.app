import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { render, toPlainText } from '@react-email/render';
import { createElement, type ReactElement } from 'react';

import { OrganisationRepository } from '../../repositories/organisations/organisation/organisation.repository.ts';
import type { Env } from '../config/env.schema.ts';
import { UnitOfWork } from '../database/unit-of-work.ts';
import { FileService } from '../files/file.service.ts';
import { MailSender, type MailAttachment } from '../ports/mail-sender/mail-sender.port.ts';
import type { EmailBrand } from './email-layout.tsx';

// Login links, email verification and invitations go on auth; everything else on notification.
export type EmailStream = 'auth' | 'notification';

// An email the platform sends: the stream it belongs to, its subject, and a component that renders the
// whole message through EmailLayout. The brand is always the pipeline's to give, never the caller's.
export interface EmailTemplate<Props extends object> {
  readonly stream: EmailStream;
  readonly subject: (props: Props) => string;
  readonly render: (props: Props & { brand: EmailBrand }) => ReactElement;
}

/**
 * Declare an email template.
 * @param template its stream, subject and rendering
 */
export function defineEmail<Props extends object>(template: EmailTemplate<Props>): EmailTemplate<Props> {
  return template;
}

// Whom the email is from: the Camp's name as the sender name and its contact as the reply address.
export interface EmailSender {
  readonly name: string;
  readonly replyTo: string;
}

export interface EmailOptions {
  readonly to: readonly string[];
  readonly sender: EmailSender;
  // Files of the current Organisation, attached under their stored names.
  readonly attachments?: readonly string[];
}

// The one pipeline every email goes through: a React template, rendered with the brand, sent through
// the mail port from the platform's address of the template's stream. Call it from a job, never from a
// request. One call is one message, so a job that sends once never repeats a mail its retry follows.
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(
    private readonly organisations: OrganisationRepository,
    private readonly unitOfWork: UnitOfWork,
    private readonly files: FileService,
    private readonly mailSender: MailSender,
    private readonly config: ConfigService<Env, true>,
  ) {}

  /**
   * Render an email of the current Organisation and send it, unless the Organisation is suspended.
   * @param template the email's template
   * @param props what the template shows besides the brand
   * @param options recipients, sender and attachments
   */
  public async send<Props extends object>(
    template: EmailTemplate<Props>,
    props: Props,
    { to, sender, attachments = [] }: EmailOptions,
  ): Promise<void> {
    const organisation = await this.organisations.getByIdOrThrow(this.unitOfWork.organisationId);

    // Not sent at all rather than failed: a retry would not change the outcome.
    if (organisation.status === 'suspended') {
      this.logger.warn(`Email not sent: Organisation ${organisation.id} is suspended`);

      return;
    }

    const brand: EmailBrand = { name: sender.name, contact: sender.replyTo, accentColour: organisation.accentColour };
    const html = await render(createElement(template.render, { ...props, brand }));

    await this.mailSender.send({
      from: formatAddress(sender.name, this.config.get('mailStreams', { infer: true })[template.stream]),
      to: [...to],
      replyTo: sender.replyTo,
      subject: template.subject(props),
      html,
      text: toPlainText(html),
      attachments: await Promise.all(attachments.map((fileId) => this.attachment(fileId))),
    });
  }

  /**
   * Read a stored file as an attachment.
   * @param fileId the file's id
   */
  private async attachment(fileId: string): Promise<MailAttachment> {
    const file = await this.files.read(fileId);

    return { filename: file.name, contentType: file.contentType, content: file.bytes };
  }
}

/**
 * Build a From header's address with a display name. The name is an admin's text, so it is always
 * quoted and stripped of line breaks: a comma, an angle bracket or a new line could otherwise add a
 * recipient or a header.
 * @param name the display name
 * @param address the bare address
 */
function formatAddress(name: string, address: string): string {
  const quoted = name
    // oxlint-disable-next-line no-control-regex
    .replaceAll(/[\u0000-\u001f\u007f]+/g, ' ')
    .replaceAll(/\s+/g, ' ')
    .trim()
    .replaceAll(/["\\]/g, (character) => `\\${character}`);

  return `"${quoted}" <${address}>`;
}
