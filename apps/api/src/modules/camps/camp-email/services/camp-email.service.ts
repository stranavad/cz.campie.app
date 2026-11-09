import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import {
  campEmailDraftBodySchema,
  EMAIL_TYPE_SPECS,
  EMAIL_TYPES,
  fillPlaceholders,
  SAMPLE_PLACEHOLDER_VALUES,
  unknownPlaceholders,
  type CampEmailDraftBody,
  type CampEmailText,
  type CampEmailTextBody,
  type EmailPlaceholder,
  type EmailPreview,
  type EmailTextErrorCode,
  type EmailType,
} from '@repo/schema/emails';

import type { Actor } from '../../../../core/audit/actor.ts';
import { AuditService } from '../../../../core/audit/audit.service.ts';
import type { Env } from '../../../../core/config/env.schema.ts';
import { UnitOfWork } from '../../../../core/database/unit-of-work.ts';
import { EmailService, type EmailOptions, type EmailSender } from '../../../../core/emails/email.service.ts';
import type { Encrypted } from '../../../../core/encryption/cipher.ts';
import { EncryptionService } from '../../../../core/encryption/encryption.service.ts';
import { JobQueue } from '../../../../core/jobs/job-queue.ts';
import { RateLimiter, type RequestLimit } from '../../../../core/rate-limits/rate-limiter.ts';
import { AdminRepository } from '../../../../repositories/admins/admin/admin.repository.ts';
import {
  CampEmailTextRepository,
  type CampEmailTextRow,
} from '../../../../repositories/camps/camp-email-text/camp-email-text.repository.ts';
import type { CampEntity } from '../../../../repositories/camps/camp/camp.entity.ts';
import { CampRepository } from '../../../../repositories/camps/camp/camp.repository.ts';
import { OrganisationRepository } from '../../../../repositories/organisations/organisation/organisation.repository.ts';
import { CAMP_EMAILS, type CampEmailProps } from '../camp-email.email.tsx';
import { sendTestCampEmailJob } from '../send-test-email.job.ts';

// The Camp's name and contact the service fills in itself.
type FilledByCamp = 'tabor' | 'kontakt';

export interface CampEmailMessage {
  // Values of the type's other placeholders; the ones a type does not offer are never shown.
  readonly values: Readonly<Partial<Record<Exclude<EmailPlaceholder, FilledByCamp>, string>>>;
  // The guardians; an email to the Camp's team goes to its notification recipients instead.
  readonly to: readonly string[];
  readonly actionHref?: CampEmailProps['actionHref'];
  readonly payment?: CampEmailProps['payment'];
  readonly details?: CampEmailProps['details'];
  readonly attachments?: readonly string[];
  readonly inlineImages?: EmailOptions['inlineImages'];
}

// The emails a Camp sends, worded by the Camp or by the platform's defaults, and switched on or off per
// type. Permission (Camp settings) is the route's.
@Injectable()
export class CampEmailService {
  private readonly logger = new Logger(CampEmailService.name);
  private readonly testLimit: RequestLimit;

  constructor(
    private readonly texts: CampEmailTextRepository,
    private readonly camps: CampRepository,
    private readonly organisations: OrganisationRepository,
    private readonly admins: AdminRepository,
    private readonly emails: EmailService,
    private readonly encryption: EncryptionService,
    private readonly audit: AuditService,
    private readonly jobs: JobQueue,
    private readonly rateLimiter: RateLimiter,
    private readonly unitOfWork: UnitOfWork,
    config: ConfigService<Env, true>,
  ) {
    this.testLimit = config.get('requestLimits', { infer: true }).testEmail;
  }

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
  public async preview(campId: string, type: EmailType, draft: CampEmailDraftBody): Promise<EmailPreview> {
    const { template, props, sender } = await this.sampleOf(await this.camps.getByIdOrThrow(campId), type, draft);

    return this.emails.preview(template, props, sender);
  }

  /**
   * Have a subject and text of an email type sent, as the preview renders them, to the admin asking and
   * nobody else. Limited per admin and address, every attempt counted.
   * @param actor the admin, whose own address it goes to
   * @param campId Camp id
   * @param type the email type
   * @param draft the subject and text to try
   * @throws {BadRequestException} email_placeholders_unknown when the subject or text uses a placeholder
   * the type does not offer
   */
  public async requestTest(actor: Actor, campId: string, type: EmailType, draft: CampEmailDraftBody): Promise<void> {
    if (actor.kind !== 'admin' && actor.kind !== 'operator') {
      throw new Error('Only an admin is sent a test email');
    }

    await this.rateLimiter.admit(this.testLimit, { ipAddress: actor.ipAddress, target: actor.identity });
    await this.camps.getByIdOrThrow(campId);

    if (unknownPlaceholders(`${draft.subject}\n${draft.text}`, EMAIL_TYPE_SPECS[type].placeholders).length > 0) {
      throw refused('email_placeholders_unknown');
    }

    const sealedDraft = (await this.encryption.cipher()).encrypt(JSON.stringify(draft)).toString('base64');

    this.jobs.enqueue(sendTestCampEmailJob, { adminId: actor.identity, campId, type, sealedDraft });
  }

  /**
   * Send a draft of an email type, rendered with made-up data, to an admin's own address alone, even of a
   * type the Camp switched off or one sent to its team. Call it from a job, as every email.
   * @param adminId the admin who asked for it
   * @param campId Camp id
   * @param type the email type
   * @param sealedDraft the subject and text to try, as requestTest sealed them
   */
  public async sendTest(adminId: string, campId: string, type: EmailType, sealedDraft: string): Promise<void> {
    const admin = await this.admins.getByIdOrThrow(adminId);
    const cipher = await this.encryption.cipher();
    const draft = campEmailDraftBodySchema.parse(
      JSON.parse(cipher.decrypt(Buffer.from(sealedDraft, 'base64') as Encrypted)),
    );
    const { template, props, sender } = await this.sampleOf(await this.camps.getByIdOrThrow(campId), type, draft);

    await this.emails.send(template, props, { to: [admin.email], sender });
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
        details: message.details,
      },
      { to, sender, attachments: message.attachments, inlineImages: message.inlineImages },
    );

    return true;
  }

  /**
   * Tell whether a Camp sends its email of a type, or switched it off.
   * @param campId Camp id
   * @param type the email type
   */
  public async isEnabled(campId: string, type: EmailType): Promise<boolean> {
    return shown(type, await this.ownOf(campId, type)).enabled;
  }

  /**
   * Name whom a Camp's platform emails are from: the Camp, replying to its contact, else the Organisation's.
   * @param campId Camp id
   */
  public async senderFor(campId: string): Promise<EmailSender> {
    return this.senderOf(await this.camps.getByIdOrThrow(campId));
  }

  /**
   * Fill a draft of an email type with made-up data, as the Camp would send it: never a real Registration's,
   * and a login link's button leads nowhere.
   * @param camp the Camp
   * @param type the email type
   * @param draft the subject and text to try
   */
  private async sampleOf(camp: CampEntity, type: EmailType, draft: CampEmailDraftBody) {
    const { stream } = EMAIL_TYPE_SPECS[type];
    const sender = await this.senderOf(camp);
    const values = valuesFor(type, { ...SAMPLE_PLACEHOLDER_VALUES, tabor: camp.name, kontakt: sender.replyTo });

    return {
      template: CAMP_EMAILS[stream],
      props: {
        subject: fillPlaceholders(draft.subject, values),
        text: draft.text,
        values,
        ...(stream === 'auth' ? { actionHref: '#' } : {}),
      },
      sender,
    };
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
