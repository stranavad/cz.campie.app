import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { EmailVerificationErrorCode, VerifyEmailBody } from '@repo/schema/admins';

import type { Actor } from '../../../../core/audit/actor.ts';
import { AuditService } from '../../../../core/audit/audit.service.ts';
import type { Env } from '../../../../core/config/env.schema.ts';
import { UnitOfWork } from '../../../../core/database/unit-of-work.ts';
import { JobQueue } from '../../../../core/jobs/job-queue.ts';
import { Clock } from '../../../../core/ports/clock/clock.port.ts';
import { RateLimiter, type RequestLimit } from '../../../../core/rate-limits/rate-limiter.ts';
import { generateSessionToken, hashSessionToken } from '../../../../core/sessions/session-token.ts';
import type { AdminEntity } from '../../../../repositories/admins/admin/admin.entity.ts';
import { EmailVerificationRepository } from '../../../../repositories/admins/email-verification/email-verification.repository.ts';
import { AdminService } from '../../admin/services/admin.service.ts';
import { emailVerificationRequestedJob } from '../email-verification-requested.job.ts';

// Long enough for a signer who reads mail at the weekend, as an invitation.
export const EMAIL_VERIFICATION_VALID_DAYS = 7;

const DAY_MS = 24 * 60 * 60 * 1000;

// Proves a signed-up admin's email theirs by a link sent to it. Until then whoever opens an invitation or a
// reset link sent to that email takes the account over.
@Injectable()
export class EmailVerificationService {
  private readonly requestLimit: RequestLimit;

  constructor(
    private readonly emailVerifications: EmailVerificationRepository,
    private readonly admins: AdminService,
    private readonly audit: AuditService,
    private readonly jobs: JobQueue,
    private readonly rateLimiter: RateLimiter,
    private readonly unitOfWork: UnitOfWork,
    private readonly clock: Clock,
    config: ConfigService<Env, true>,
  ) {
    // The link goes to the account's own address, as a reset link does, so both share one budget.
    this.requestLimit = config.get('requestLimits', { infer: true }).passwordReset;
  }

  /**
   * Email an admin a link that verifies their email, once this commits, from the current Organisation's
   * unit of work, whose log records the verification.
   * @param adminId admin id
   */
  public send(adminId: string): void {
    this.jobs.enqueue(emailVerificationRequestedJob, { adminId });
  }

  /**
   * Email the signed-in admin a new link, unless their email is verified already. Counts against the
   * reset limit of the IP address and the email.
   * @param adminId the signed-in admin
   * @param ipAddress where the request comes from
   */
  public async resend(adminId: string, ipAddress: string): Promise<void> {
    const admin = await this.admins.getByIdOrThrow(adminId);

    await this.rateLimiter.admit(this.requestLimit, { ipAddress, target: admin.email });

    if (admin.emailVerifiedAt === null) {
      this.send(adminId);
    }
  }

  /**
   * Make an admin's verification link in the current Organisation, valid from now, in place of an earlier
   * one: only the token's hash is stored, the token goes into the email. Null once the email is verified.
   * @param adminId admin id
   */
  public async start(adminId: string): Promise<{ admin: AdminEntity; token: string } | null> {
    const admin = await this.admins.getByIdOrThrow(adminId);

    if (admin.emailVerifiedAt !== null) {
      return null;
    }

    const token = generateSessionToken();

    await this.emailVerifications.replace({
      adminId,
      tokenHash: hashSessionToken(token),
      expiresAt: new Date(this.clock.now().getTime() + EMAIL_VERIFICATION_VALID_DAYS * DAY_MS),
    });

    return { admin, token };
  }

  /**
   * Verify an admin's email through a link, which then stops working, in a platform unit of work that
   * enters the Organisation the link was sent for, audited there as the admin. An email verified meanwhile
   * by other means stays as it is.
   * @param body the token from the link
   * @param ipAddress where the admin acts from
   * @throws {BadRequestException} when the link is unknown, used or expired
   */
  public async complete({ token }: VerifyEmailBody, ipAddress: string): Promise<void> {
    const verification = await this.emailVerifications.getByTokenHash(hashSessionToken(token));

    if (
      verification === null ||
      verification.expiresAt <= this.clock.now() ||
      !(await this.emailVerifications.consume(verification.id))
    ) {
      const code: EmailVerificationErrorCode = 'email_verification_invalid';

      throw new BadRequestException({ code, message: `Email verification refused: ${code}` });
    }

    const change = await this.admins.verifyEmail(verification.adminId);

    if (change === null) {
      return;
    }

    await this.unitOfWork.enter(verification.organisationId);
    const actor: Actor = { kind: 'admin', identity: verification.adminId, ipAddress };

    await this.audit.record(actor, {
      action: 'admin.verify_email',
      target: { type: 'admin', id: verification.adminId },
      change,
    });
  }
}
