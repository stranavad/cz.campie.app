import { BadRequestException, Injectable, Logger } from '@nestjs/common';

import {
  EMAIL_TYPE_SPECS,
  EMAIL_TYPES,
  fillPlaceholders,
  SAMPLE_PLACEHOLDER_VALUES,
  unknownPlaceholders,
  type CampEmailText,
  type CampEmailTextBody,
  type EmailPlaceholder,
  type EmailPreview,
  type EmailTextErrorCode,
  type EmailType,
} from '@repo/schema/emails';

import type { Actor } from '../../../../core/audit/actor.ts';
import { AuditService } from '../../../../core/audit/audit.service.ts';
import { UnitOfWork } from '../../../../core/database/unit-of-work.ts';
import { EmailService, type EmailSender } from '../../../../core/emails/email.service.ts';
import {
  CampEmailTextRepository,
  type CampEmailTextRow,
} from '../../../../repositories/camps/camp-email-text/camp-email-text.repository.ts';
import type { CampEntity } from '../../../../repositories/camps/camp/camp.entity.ts';
import { CampRepository } from '../../../../repositories/camps/camp/camp.repository.ts';
import { OrganisationRepository } from '../../../../repositories/organisations/organisation/organisation.repository.ts';
import { CAMP_EMAILS, type CampEmailProps } from '../camp-email.email.tsx';

// The Camp's name and contact the service fills in itself.
type FilledByCamp = 'tabor' | 'kontakt';

export interface CampEmailMessage {
  // Values of the type's other placeholders; the ones a type does not offer are never shown.
  readonly values: Readonly<Partial<Record<Exclude<EmailPlaceholder, FilledByCamp>, string>>>;
  // The guardians; an email to the Camp's team goes to its notification recipients instead.
  readonly to: readonly string[];
  readonly actionHref?: CampEmailProps['actionHref'];
  readonly payment?: CampEmailProps['payment'];
  readonly attachments?: readonly string[];
}

// The emails a Camp sends, worded by the Camp or by the platform's defaults, and switched on or off per
// type. Permission (Camp settings) is the route's.
@Injectable()
export class CampEmailService {
  private readonly logger = new Logger(CampEmailService.name);

  constructor(
    private readonly texts: CampEmailTextRepository,
    private readonly camps: CampRepository,
    private readonly organisations: OrganisationRepository,
    private readonly emails: EmailService,
    private readonly audit: AuditService,
    private readonly unitOfWork: UnitOfWork,
  ) {}

  /**
   * List a Camp's emails, one per type in their fixed order, its own wording or the defaults.
   * @param campId Camp id
   */
  public async list(campId: string): Promise<CampEmailText[]> {
    await this.camps.getByIdOrThrow(campId);
    const own = await this.texts.listByCamp(campId);

    return EMAIL_TYPES.map((type) => shown(type, own.find((row) => row.type === type) ?? null));
  }

  /**
   * Save a Camp's own wording of an email type and whether it is sent, audited.
   * @param actor who does it
   * @param campId Camp id
   * @param type the email type
   * @param body the subject, text and switch
   * @throws {BadRequestException} email_placeholders_unknown when the subject or text uses a placeholder
   * the type does not offer; email_type_required when switching off a type that cannot be
   */
  public async save(actor: Actor, campId: string, type: EmailType, body: CampEmailTextBody): Promise<CampEmailText> {
    await this.camps.getByIdOrThrow(campId);
    const spec = EMAIL_TYPE_SPECS[type];

    if (unknownPlaceholders(`${body.subject}\n${body.text}`, spec.placeholders).length > 0) {
      throw refused('email_placeholders_unknown');
    }

    if (!body.enabled && !spec.canSwitchOff) {
      throw refused('email_type_required');
    }

    const before = await this.ownOf(campId, type);
    const after: CampEmailTextRow = { campId, type, ...body };

    await this.texts.save(after);
    await this.audit.record(actor, {
      action: 'camp_email_text.update',
      target: { type: 'camp_email_text', id: campId },
      change: { before, after },
    });

    return shown(type, after);
  }

  /**
   * Return an email type to the platform's default wording, sent, audited.
   * @param actor who does it
   * @param campId Camp id
   * @param type the email type
   */
  public async reset(actor: Actor, campId: string, type: EmailType): Promise<CampEmailText> {
    await this.camps.getByIdOrThrow(campId);
    const before = await this.ownOf(campId, type);

    if (before !== null) {
      await this.texts.remove(campId, type);
      await this.audit.record(actor, {
        action: 'camp_email_text.remove',
        target: { type: 'camp_email_text', id: campId },
        change: { before, after: null },
      });
    }

    return shown(type, null);
  }

  /**
   * Render a subject and text of an email type as the Camp would send it, with made-up data.
   * @param campId Camp id
   * @param type the email type
   * @param draft the subject and text to try
   */
  public async preview(
    campId: string,
    type: EmailType,
    draft: Pick<CampEmailTextBody, 'subject' | 'text'>,
  ): Promise<EmailPreview> {
    const camp = await this.camps.getByIdOrThrow(campId);
    const spec = EMAIL_TYPE_SPECS[type];
    const sender = await this.senderOf(camp);
    const values = valuesFor(type, { ...SAMPLE_PLACEHOLDER_VALUES, tabor: camp.name, kontakt: sender.replyTo });

    return this.emails.preview(
      CAMP_EMAILS[spec.stream],
      {
        subject: fillPlaceholders(draft.subject, values),
        text: draft.text,
        values,
        ...(spec.stream === 'auth' ? { actionHref: '#' } : {}),
      },
      sender,
    );
  }

  /**
   * Send a Camp's email of a type, worded as the Camp set it, with the Camp's name and contact filled in,
   * from the current Organisation's unit of work. Not sent when the Camp switched the type off, nor an
   * email to the Camp's team while it names no recipient. Call it from a job, as every email.
   * @param campId Camp id
   * @param type the email type
   * @param message the placeholder values, recipients and the platform's fixed parts
   * @returns whether it was sent
   */
  public async send(campId: string, type: EmailType, message: CampEmailMessage): Promise<boolean> {
    const camp = await this.camps.getByIdOrThrow(campId);
    const spec = EMAIL_TYPE_SPECS[type];
    const { subject, text, enabled } = shown(type, await this.ownOf(campId, type));
    const to = spec.audience === 'camp' ? camp.notificationEmails : message.to;

    if (!enabled || to.length === 0) {
      this.logger.log(`Email ${type} of Camp ${campId} not sent: ${enabled ? 'no recipient' : 'switched off'}`);

      return false;
    }

    const sender = await this.senderOf(camp);
    const values = valuesFor(type, { ...message.values, tabor: camp.name, kontakt: sender.replyTo });

    await this.emails.send(
      CAMP_EMAILS[spec.stream],
      {
        subject: fillPlaceholders(subject, values),
        text,
        values,
        actionHref: message.actionHref,
        payment: message.payment,
      },
      { to, sender, attachments: message.attachments },
    );

    return true;
  }

  /**
   * Get a Camp's own wording of an email type.
   * @param campId Camp id
   * @param type the email type
   */
  private async ownOf(campId: string, type: EmailType): Promise<CampEmailTextRow | null> {
    return (await this.texts.listByCamp(campId)).find((row) => row.type === type) ?? null;
  }

  /**
   * Name whom a Camp's email is from: the Camp, replying to its contact, else the Organisation's.
   * @param camp the Camp
   */
  private async senderOf(camp: CampEntity): Promise<EmailSender> {
    const organisation = await this.organisations.getByIdOrThrow(this.unitOfWork.organisationId);

    return { name: camp.name, replyTo: camp.contactEmail ?? organisation.contactEmail };
  }
}

/**
 * Show an email type with a Camp's own wording, or the defaults when it has none.
 * @param type the email type
 * @param own the Camp's own wording, if any
 */
function shown(type: EmailType, own: CampEmailTextRow | null): CampEmailText {
  const spec = EMAIL_TYPE_SPECS[type];

  return {
    type,
    subject: own?.subject ?? spec.subject,
    text: own?.text ?? spec.text,
    enabled: own?.enabled ?? true,
    customised: own !== null,
    canSwitchOff: spec.canSwitchOff,
    placeholders: [...spec.placeholders],
  };
}

/**
 * Keep only the values of placeholders a type offers.
 * @param type the email type
 * @param values the values at hand
 */
function valuesFor(type: EmailType, values: Readonly<Record<string, string>>): Record<string, string> {
  return Object.fromEntries(
    EMAIL_TYPE_SPECS[type].placeholders.flatMap((name) =>
      Object.hasOwn(values, name) ? [[name, values[name] ?? '']] : [],
    ),
  );
}

function refused(code: EmailTextErrorCode): BadRequestException {
  return new BadRequestException({ code, message: `Email text refused: ${code}` });
}
