import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type {
  AccountErrorCode,
  ConfirmEmailChangeBody,
  EmailChangeErrorCode,
  RequestEmailChangeBody,
} from '@repo/schema/admins';

import type { Actor } from '../../../../core/audit/actor.ts';
import { AuditService } from '../../../../core/audit/audit.service.ts';
import type { Env } from '../../../../core/config/env.schema.ts';
import { EmailService } from '../../../../core/emails/email.service.ts';
import { JobQueue } from '../../../../core/jobs/job-queue.ts';
import { Clock } from '../../../../core/ports/clock/clock.port.ts';
import { RateLimiter, type RequestLimit } from '../../../../core/rate-limits/rate-limiter.ts';
import { generateSessionToken, hashSessionToken } from '../../../../core/sessions/session-token.ts';
import { EmailChangeRepository } from '../../../../repositories/admins/email-change/email-change.repository.ts';
import { PasswordResetRepository } from '../../../../repositories/admins/password-reset/password-reset.repository.ts';
import { AccountChangedEmail } from '../../account/account-changed.email.tsx';
import { adminOf } from '../../account/services/account.service.ts';
import { AdminService } from '../../admin/services/admin.service.ts';
import { LoginService } from '../../login/services/login.service.ts';
import { TotpService } from '../../totp/services/totp.service.ts';
import { AdminEmailChangeEmail } from '../email-change.email.tsx';
import { adminEmailChangeConfirmedJob, adminEmailChangeRequestedJob } from '../email-change.jobs.ts';

// Long enough to reach a mailbox not checked every hour.
const CONFIRMATION_VALID_HOURS = 24;

// An admin's email changes only once the new address follows its link: until then the old one signs in,
// and afterwards it is told of the change.
@Injectable()
export class EmailChangeService {
  private readonly requestLimit: RequestLimit;
  private readonly productName: string;
  private readonly appUrl: string;

  constructor(
    private readonly emailChanges: EmailChangeRepository,
    private readonly passwordResets: PasswordResetRepository,
    private readonly admins: AdminService,
    private readonly logins: LoginService,
    private readonly totp: TotpService,
    private readonly audit: AuditService,
    private readonly emails: EmailService,
    private readonly jobs: JobQueue,
    private readonly rateLimiter: RateLimiter,
    private readonly clock: Clock,
    config: ConfigService<Env, true>,
  ) {
    // Each request mails an address the admin chose, as a reset link does, so both share one budget.
    this.requestLimit = config.get('requestLimits', { infer: true }).passwordReset;
    this.productName = config.get('PRODUCT_NAME', { infer: true });
    this.appUrl = `${config.get('PLATFORM_SCHEME', { infer: true })}://app.${config.get('PLATFORM_DOMAIN', { infer: true })}`;
  }

  /**
   * Ask to change the signed-in admin's email with their current password, which counts against the login
   * limits when wrong: the new address gets a confirmation link once this commits. Whether another admin
   * has the address is not checked here, so the answer tells nothing about who has an account. With
   * two-step login on, only from a session that passed it. Counts against the reset limit of the IP address
   * and the new address.
   * @param actor the signed-in admin
   * @param session their session
   * @param body the new email and the current password
   * @throws {BadRequestException} email_unchanged when the address is the admin's own already
   */
  public async request(
    actor: Actor,
    session: { readonly secondFactor: boolean },
    { email, currentPassword }: RequestEmailChangeBody,
  ): Promise<void> {
    const { identity, ipAddress } = adminOf(actor);

    await this.totp.requirePassed(identity, session);

    const admin = await this.admins.getByIdOrThrow(identity);

    if (admin.email === email) {
      const code: AccountErrorCode = 'email_unchanged';

      throw new BadRequestException({ code, message: 'The email is the account’s own already' });
    }

    await this.logins.confirmPassword(admin.email, currentPassword, ipAddress);
    await this.rateLimiter.admit(this.requestLimit, { ipAddress, target: email });

    // The link's own token is made in the job; until then no token opens the change.
    const changeId = await this.emailChanges.replace(
      admin.id,
      email,
      hashSessionToken(generateSessionToken()),
      new Date(this.clock.now().getTime() + CONFIRMATION_VALID_HOURS * 60 * 60 * 1000),
    );

    this.jobs.enqueue(adminEmailChangeRequestedJob, { changeId });
  }

  /**
   * Email a waiting change's confirmation link to its new address, unless another admin has it: they
   * would only be puzzled by a link that cannot work.
   * @param changeId the change
   */
  public async sendConfirmation(changeId: string): Promise<void> {
    const token = generateSessionToken();
    const change = await this.emailChanges.issue(changeId, hashSessionToken(token));

    if (change === null || (await this.admins.getByEmail(change.email)) !== null) {
      return;
    }

    await this.emails.sendForPlatform(
      AdminEmailChangeEmail,
      {
        link: `${this.appUrl}/zmena-emailu?token=${token}`,
        validHours: CONFIRMATION_VALID_HOURS,
        productName: this.productName,
      },
      { to: [change.email] },
    );
  }

  /**
   * Follow a change's link, once: the admin's email changes and counts as verified, a reset link mailed to
   * the old address stops working, the platform's log records the change as the admin, and the old address
   * is told once this commits.
   * @param body the token from the link
   * @param ipAddress where the request comes from
   * @throws {BadRequestException} email_change_invalid when the link is unknown, used, replaced or expired
   * @throws {ConflictException} email_taken when another admin has the address by now
   */
  public async confirm({ token }: ConfirmEmailChangeBody, ipAddress: string): Promise<void> {
    const change = await this.emailChanges.confirm(hashSessionToken(token), this.clock.now());

    if (change === null) {
      throw refused('email_change_invalid', BadRequestException);
    }

    if ((await this.admins.getByEmail(change.email)) !== null) {
      throw refused('email_taken', ConflictException);
    }

    const { before, after } = await this.admins.changeEmail(change.adminId, change.email);

    await this.passwordResets.removeByAdmin(change.adminId);
    await this.emailChanges.keepPreviousEmail(change.id, before.email);
    await this.audit.recordForPlatform(
      { kind: 'admin', identity: change.adminId, ipAddress },
      { action: 'admin.change_email', target: { type: 'admin', id: change.adminId }, change: { before, after } },
    );
    this.jobs.enqueue(adminEmailChangeConfirmedJob, { changeId: change.id });
  }

  /**
   * Tell the old address of a confirmed change, once.
   * @param changeId the change
   */
  public async sendNotice(changeId: string): Promise<void> {
    const previousEmail = await this.emailChanges.takePreviousEmail(changeId);

    if (previousEmail !== null) {
      await this.emails.sendForPlatform(AccountChangedEmail, { change: 'email' }, { to: [previousEmail] });
    }
  }
}

/**
 * Refuse a confirmation with the code the app translates.
 * @param code the code
 * @param Exception the exception's class, by the status it answers
 */
function refused(
  code: EmailChangeErrorCode,
  Exception: typeof BadRequestException | typeof ConflictException,
): BadRequestException | ConflictException {
  return new Exception({ code, message: `Email change refused: ${code}` });
}
