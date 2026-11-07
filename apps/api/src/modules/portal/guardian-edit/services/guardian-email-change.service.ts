import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type {
  ConfirmGuardianEmailChangeBody,
  GuardianEditErrorCode,
  GuardianEmailChangeBody,
} from '@repo/schema/portal';

import type { Actor } from '../../../../core/audit/actor.ts';
import { AuditService } from '../../../../core/audit/audit.service.ts';
import type { Env } from '../../../../core/config/env.schema.ts';
import { UnitOfWork } from '../../../../core/database/unit-of-work.ts';
import { EmailService } from '../../../../core/emails/email.service.ts';
import { JobQueue } from '../../../../core/jobs/job-queue.ts';
import { Clock } from '../../../../core/ports/clock/clock.port.ts';
import { RateLimiter, type RequestLimit } from '../../../../core/rate-limits/rate-limiter.ts';
import { generateSessionToken, hashSessionToken } from '../../../../core/sessions/session-token.ts';
import { CampRepository } from '../../../../repositories/camps/camp/camp.repository.ts';
import { TurnusRepository } from '../../../../repositories/camps/turnus/turnus.repository.ts';
import { OrganisationRepository } from '../../../../repositories/organisations/organisation/organisation.repository.ts';
import { GuardianEmailChangeRepository } from '../../../../repositories/registrations/guardian-email-change/guardian-email-change.repository.ts';
import { RegistrationRepository } from '../../../../repositories/registrations/registration/registration.repository.ts';
import { CampEmailService } from '../../../camps/camp-email/services/camp-email.service.ts';
import { UndeliverableEmailService } from '../../../emails/undeliverable-email/services/undeliverable-email.service.ts';
import { emailChangeConfirmedJob } from '../../../registrations/guardian-email/guardian-email-notice.job.ts';
import { emailChangeRequestedJob } from '../guardian-edit.jobs.ts';
import { EmailChangeConfirmationEmail } from '../guardian-email-change.email.tsx';
import { GuardianEditService } from './guardian-edit.service.ts';

// Long enough to reach a mailbox not checked every hour.
const CONFIRMATION_VALID_HOURS = 24;

// A guardian's email changes only once the new address follows its link: until then the old one keeps
// access, and afterwards it is told of the change.
@Injectable()
export class GuardianEmailChangeService {
  private readonly scheme: string;
  private readonly domain: string;
  private readonly limit: RequestLimit;

  constructor(
    private readonly undeliverable: UndeliverableEmailService,
    private readonly edits: GuardianEditService,
    private readonly changes: GuardianEmailChangeRepository,
    private readonly registrations: RegistrationRepository,
    private readonly turnusy: TurnusRepository,
    private readonly camps: CampRepository,
    private readonly organisations: OrganisationRepository,
    private readonly campEmails: CampEmailService,
    private readonly emails: EmailService,
    private readonly jobs: JobQueue,
    private readonly audit: AuditService,
    private readonly rateLimiter: RateLimiter,
    private readonly unitOfWork: UnitOfWork,
    private readonly clock: Clock,
    config: ConfigService<Env, true>,
  ) {
    this.limit = config.get('requestLimits', { infer: true }).loginLink;
    this.scheme = config.get('PLATFORM_SCHEME', { infer: true });
    this.domain = config.get('PLATFORM_DOMAIN', { infer: true });
  }

  /**
   * Ask to change a guardian's email, audited: the new address gets a confirmation link once this commits.
   * Counts against the login link limit of the address and of the asking guardian, since each request
   * mails an address the guardian chose.
   * @param actor the signed-in guardian
   * @param email their email
   * @param registrationId Registration id
   * @param position the guardian's position, 1 or 2
   * @param body the new email
   * @throws {ConflictException} guardian_email_taken when the other guardian has the address
   */
  public async request(
    actor: Actor,
    email: string,
    registrationId: string,
    position: number,
    body: GuardianEmailChangeBody,
  ): Promise<void> {
    if (actor.kind === 'system') {
      throw new Error('A guardian asks for an email change, never the system');
    }

    await this.rateLimiter.admit(this.limit, {
      ipAddress: actor.ipAddress,
      target: `${this.unitOfWork.organisationId}:${email}`,
    });
    await this.edits.loadEditable(email, registrationId);
    const guardians = await this.registrations.listGuardians(registrationId);
    const guardian = guardians[position - 1];

    if (guardian === undefined) {
      throw new NotFoundException();
    }

    if (guardian.email === body.email) {
      return;
    }

    if (guardians.some((other) => other.email === body.email)) {
      throw refused('guardian_email_taken');
    }

    // The link's own token is made in the job; until then no token opens the change.
    const changeId = await this.changes.replace(
      { registrationId, position, email: body.email },
      hashSessionToken(generateSessionToken()),
      new Date(this.clock.now().getTime() + CONFIRMATION_VALID_HOURS * 60 * 60 * 1000),
    );

    await this.audit.record(actor, {
      action: 'registration_guardian.request_email_change',
      target: { type: 'registration', id: registrationId },
      change: { before: null, after: { position, email: body.email } },
    });
    this.jobs.enqueue(emailChangeRequestedJob, { changeId });
  }

  /**
   * Email a waiting change's confirmation link to its new address, from the Registration's Camp.
   * @param changeId the change
   */
  public async sendConfirmation(changeId: string): Promise<void> {
    const token = generateSessionToken();
    const change = await this.changes.issue(changeId, hashSessionToken(token));

    if (change === null) {
      return;
    }

    const { campId, campName } = await this.campOf(change.registrationId);
    const organisation = await this.organisations.getByIdOrThrow(this.unitOfWork.organisationId);

    await this.emails.send(
      EmailChangeConfirmationEmail,
      {
        link: `${this.scheme}://${organisation.subdomain}.${this.domain}/portal/potvrzeni-emailu?token=${token}`,
        campName,
        validHours: CONFIRMATION_VALID_HOURS,
      },
      { to: [change.email], sender: await this.campEmails.senderFor(campId) },
    );
  }

  /**
   * Follow a change's link, once: the guardian's email changes, audited, and the old address is told once
   * this commits.
   * @param body the token from the link
   * @param ipAddress where the request comes from
   * @throws {BadRequestException} email_change_invalid when the link is unknown, used or expired
   * @throws {ConflictException} guardian_email_taken when the other guardian took the address meanwhile;
   * registration_locked after the Camp's contact-edit lock date
   */
  public async confirm({ token }: ConfirmGuardianEmailChangeBody, ipAddress: string): Promise<void> {
    const change = await this.changes.confirm(hashSessionToken(token), this.clock.now());

    if (change === null) {
      const code: GuardianEditErrorCode = 'email_change_invalid';

      throw new BadRequestException({ code, message: 'The confirmation link is unknown, used or expired' });
    }

    const { lockDate } = await this.campOf(change.registrationId);

    if (!this.edits.isEditable(lockDate)) {
      throw refused('registration_locked');
    }

    const guardians = await this.registrations.listGuardians(change.registrationId);
    const before = guardians[change.position - 1];

    if (before === undefined) {
      throw new NotFoundException();
    }

    if (guardians.some((other) => other.email === change.email)) {
      throw refused('guardian_email_taken');
    }

    await this.registrations.updateGuardian(change.registrationId, change.position, { email: change.email });
    await this.changes.keepPreviousEmail(change.id, before.email);

    const actor: Actor = { kind: 'guardian', identity: change.email, ipAddress };
    await this.audit.record(actor, {
      action: 'registration_guardian.update',
      target: { type: 'registration', id: change.registrationId },
      change: {
        before: { position: change.position, email: before.email },
        after: { position: change.position, email: change.email },
      },
    });
    // Following the link proved the address receives mail.
    await this.undeliverable.clear(actor, change.email);
    this.jobs.enqueue(emailChangeConfirmedJob, { changeId: change.id });
  }

  /**
   * Find the Camp a Registration belongs to.
   * @param registrationId Registration id
   */
  private async campOf(registrationId: string): Promise<{ campId: string; campName: string; lockDate: string | null }> {
    const registration = await this.registrations.getByIdOrThrow(registrationId);
    const turnus = await this.turnusy.getByIdOrThrow(registration.turnusId);
    const camp = await this.camps.getByIdOrThrow(turnus.campId);

    return { campId: camp.id, campName: camp.name, lockDate: camp.contactEditLockDate };
  }
}

/**
 * Refuse a change with the code the portal translates.
 * @param code the code
 */
function refused(code: GuardianEditErrorCode): ConflictException {
  return new ConflictException({ code, message: `Email change refused: ${code}` });
}
