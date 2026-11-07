import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { render, toPlainText } from '@react-email/render';
import { createElement, type ReactElement } from 'react';

import { DEFAULT_ACCENT_COLOUR } from '@repo/schema/organisations';

import type { OrganisationEntity } from '../../repositories/organisations/organisation/organisation.entity.ts';
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
  // Images the HTML shows as `cid:<contentId>`, such as a QR platba, sent along with the message.
  readonly inlineImages?: readonly InlineImage[];
}

export interface InlineImage {
  readonly contentId: string;
  readonly filename: string;
  readonly contentType: 'image/png';
  readonly content: Buffer;
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
    { to, sender, attachments = [], inlineImages = [] }: EmailOptions,
  ): Promise<void> {
    const organisation = await this.organisations.getByIdOrThrow(this.unitOfWork.organisationId);

    if (this.skippedForSuspension(organisation)) {
      return;
    }

    const brand: EmailBrand = { name: sender.name, contact: sender.replyTo, accentColour: organisation.accentColour };

    await this.deliver(template, props, brand, {
      to,
      replyTo: sender.replyTo,
      attachments: [...(await Promise.all(attachments.map((fileId) => this.attachment(fileId)))), ...inlineImages],
    });
  }

  /**
   * Render an email of the platform itself and send it under the product's name. Sent from an
   * Organisation's unit of work, about that Organisation (an invitation, an Owner change), it is skipped
   * like the Organisation's own mail while the Organisation is suspended.
   * @param template the email's template
   * @param props what the template shows besides the brand
   * @param options the recipients
   */
  public async sendForPlatform<Props extends object>(
    template: EmailTemplate<Props>,
    props: Props,
    { to }: { readonly to: readonly string[] },
  ): Promise<void> {
    if (
      this.unitOfWork.inOrganisation &&
      this.skippedForSuspension(await this.organisations.getByIdOrThrow(this.unitOfWork.organisationId))
    ) {
      return;
    }

    const name = this.config.get('PRODUCT_NAME', { infer: true });

    await this.deliver(
      template,
      props,
      { name, contact: null, accentColour: DEFAULT_ACCENT_COLOUR },
      { to, attachments: [] },
    );
  }

  /**
   * Render an email of the current Organisation as it would be sent, without sending it, for a preview.
   * @param template the email's template
   * @param props what the template shows besides the brand
   * @param sender the Camp's name and contact
   */
  public async preview<Props extends object>(
    template: EmailTemplate<Props>,
    props: Props,
    sender: EmailSender,
  ): Promise<{ subject: string; html: string }> {
    const organisation = await this.organisations.getByIdOrThrow(this.unitOfWork.organisationId);
    const brand: EmailBrand = { name: sender.name, contact: sender.replyTo, accentColour: organisation.accentColour };

    return {
      subject: oneLine(template.subject(props)),
      html: await render(createElement(template.render, { ...props, brand })),
    };
  }

  /**
   * Tell whether an Organisation's mail is skipped because it is suspended: not sent at all rather than
   * failed, since a retry would not change the outcome.
   * @param organisation the Organisation the mail is about
   */
  private skippedForSuspension(organisation: OrganisationEntity): boolean {
    if (organisation.status !== 'suspended') {
      return false;
    }

    this.logger.warn(`Email not sent: Organisation ${organisation.id} is suspended`);

    return true;
  }

  /**
   * Render an email with its brand and hand it to the mail port from the address of its stream.
   * @param template the email's template
   * @param props what the template shows besides the brand
   * @param brand whom it is from
   * @param envelope recipients, reply address and attachments
   */
  private async deliver<Props extends object>(
    template: EmailTemplate<Props>,
    props: Props,
    brand: EmailBrand,
    { to, replyTo, attachments }: { to: readonly string[]; replyTo?: string; attachments: MailAttachment[] },
  ): Promise<void> {
    const html = await render(createElement(template.render, { ...props, brand }));

    await this.mailSender.send({
      from: formatAddress(brand.name, this.config.get('mailStreams', { infer: true })[template.stream]),
      to: [...to],
      ...(replyTo === undefined ? {} : { replyTo }),
      subject: oneLine(template.subject(props)),
      html,
      text: toPlainText(html),
      attachments,
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
 * Keep a subject on one line. It carries admins' wording and guardians' answers (a child's name), and a
 * line break in a header could add another header.
 * @param subject the subject
 */
function oneLine(subject: string): string {
  return (
    subject
      // oxlint-disable-next-line no-control-regex
      .replaceAll(/[\u0000-\u001f\u007f]+/g, ' ')
      .replaceAll(/\s+/g, ' ')
      .trim()
  );
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
