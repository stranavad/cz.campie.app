import { randomInt } from 'node:crypto';
import { ConflictException, HttpException, HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import {
  RECOVERY_CODE_PATTERN,
  type MemberTotpResetErrorCode,
  type TotpEnrolment,
  type TotpErrorCode,
} from '@repo/schema/admins';

import type { Actor } from '../../../../core/audit/actor.ts';
import { AuditService } from '../../../../core/audit/audit.service.ts';
import type { Env } from '../../../../core/config/env.schema.ts';
import { UnitOfWork } from '../../../../core/database/unit-of-work.ts';
import { EncryptionService } from '../../../../core/encryption/encryption.service.ts';
import { JobQueue } from '../../../../core/jobs/job-queue.ts';
import { Clock } from '../../../../core/ports/clock/clock.port.ts';
import { RateLimiter, type RateLimit } from '../../../../core/rate-limits/rate-limiter.ts';
import type { IssuedSession } from '../../../../core/sessions/session-token.ts';
import { SessionService } from '../../../../core/sessions/session.service.ts';
import { encodeBase32, generateTotpSecret, matchTotpStep, totpUri } from '../../../../core/totp/totp.ts';
import { MembershipRepository } from '../../../../repositories/admins/membership/membership.repository.ts';
import type { TotpCredentialEntity } from '../../../../repositories/admins/totp-credential/totp-credential.entity.ts';
import { TotpCredentialRepository } from '../../../../repositories/admins/totp-credential/totp-credential.repository.ts';
import { OperatorRepository } from '../../../../repositories/operators/operator/operator.repository.ts';
import { AdminService } from '../../admin/services/admin.service.ts';
import { totpResetJob } from '../totp-reset.job.ts';

const RECOVERY_CODES = 10;
const RECOVERY_ALPHABET = 'abcdefghjkmnpqrstuvwxyz23456789';

/**
 * Make a recovery code: eight random characters, without ones easily mistaken for each other.
 */
function newRecoveryCode(): string {
  const characters = Array.from({ length: 8 }, () => RECOVERY_ALPHABET[randomInt(RECOVERY_ALPHABET.length)]);

  return `${characters.slice(0, 4).join('')}-${characters.slice(4).join('')}`;
}

/**
 * The context an admin's TOTP secret is sealed for, so it opens for that admin only.
 * @param adminId admin id
 */
function secretContext(adminId: string): string {
  return `totp:${adminId}`;
}

// Two-step login with an authenticator app, with one-time recovery codes for a lost phone. Any admin may
// turn it on; the Platform operator must, and an Organisation may require it of its admins.
@Injectable()
export class TotpService {
  private readonly productName: string;
  private readonly failures: RateLimit;

  constructor(
    private readonly credentials: TotpCredentialRepository,
    private readonly admins: AdminService,
    private readonly memberships: MembershipRepository,
    private readonly operators: OperatorRepository,
    private readonly audit: AuditService,
    private readonly jobs: JobQueue,
    private readonly sessions: SessionService,
    private readonly encryption: EncryptionService,
    private readonly rateLimiter: RateLimiter,
    private readonly unitOfWork: UnitOfWork,
    private readonly clock: Clock,
    config: ConfigService<Env, true>,
  ) {
    this.productName = config.get('PRODUCT_NAME', { infer: true });

    // Six digits fall to guessing without a limit; a wrong code counts like a wrong password.
    const { perAccount, lockoutMs } = config.get('loginLimits', { infer: true });
    this.failures = { name: 'totp-failures', max: perAccount, windowMs: lockoutMs };
  }

  /**
   * Tell whether an admin has TOTP on.
   * @param adminId admin id
   */
  public async isEnabled(adminId: string): Promise<boolean> {
    return (await this.credentials.getByAdmin(adminId))?.confirmed === true;
  }

  /**
   * Give an admin a new secret for their authenticator app, replacing one they have not confirmed.
   * @param adminId the signed-in admin
   * @throws {HttpException} 409 when the admin's TOTP is already on
   */
  public async startEnrolment(adminId: string): Promise<TotpEnrolment> {
    const secret = generateTotpSecret();
    const stored = await this.credentials.replaceUnconfirmed(
      adminId,
      this.encryption.sealPlatformSecret(secretContext(adminId), secret),
    );

    if (stored === null) {
      throw totpError('totp_enabled');
    }

    const admin = await this.admins.getByIdOrThrow(adminId);

    return {
      secret: encodeBase32(secret),
      uri: totpUri(secret, { issuer: this.productName, account: admin.email }),
    };
  }

  /**
   * Turn an admin's TOTP on with a code from the secret they were given; the session is replaced by one
   * that passed it.
   * @param adminId the signed-in admin
   * @param sessionId their session
   * @param code the code from their app
   * @throws {HttpException} 409 when there is no secret to confirm, or TOTP is already on
   */
  public async confirmEnrolment(
    adminId: string,
    sessionId: string,
    code: string,
  ): Promise<{ session: IssuedSession; recoveryCodes: string[] }> {
    const credential = await this.credentials.getByAdmin(adminId);

    if (credential === null) {
      throw totpError('totp_not_started');
    }

    if (credential.confirmed) {
      throw totpError('totp_enabled');
    }

    const step = await this.checkCode(credential, code);

    if (!(await this.credentials.confirm(adminId, credential.sealedSecret, step, this.clock.now()))) {
      throw totpError('totp_enabled');
    }

    const recoveryCodes = Array.from({ length: RECOVERY_CODES }, () => newRecoveryCode());

    await this.credentials.replaceRecoveryCodes(
      adminId,
      recoveryCodes.map((code) => this.recoveryDigest(adminId, code)),
    );

    return { session: await this.sessions.passSecondFactor(sessionId), recoveryCodes };
  }

  /**
   * Pass a session's second step with a code from the admin's app, replacing it by one that passed it. A
   * code works once.
   * @param adminId the signed-in admin
   * @param sessionId their session
   * @param code the code from their app
   * @throws {HttpException} 409 when the admin's TOTP is not on; 400 for a wrong or used code
   */
  public async verify(adminId: string, sessionId: string, code: string): Promise<IssuedSession> {
    const credential = await this.credentials.getByAdmin(adminId);

    if (credential === null || !credential.confirmed) {
      throw totpError('totp_not_enabled');
    }

    if (RECOVERY_CODE_PATTERN.test(code)) {
      await this.useRecoveryCode(adminId, code);

      return this.sessions.passSecondFactor(sessionId);
    }

    const step = await this.checkCode(credential, code);

    // A code seen already, perhaps by someone looking over a shoulder, counts as wrong.
    if (!(await this.credentials.useStep(adminId, step))) {
      throw totpError('totp_code_invalid');
    }

    return this.sessions.passSecondFactor(sessionId);
  }

  /**
   * Turn a member's two-step login off, as when they lost their phone, so they set it up again, and end
   * their sessions; audited and emailed to them. The admin identity is global, so an Owner may do it only
   * for an admin of no other Organisation and not the Platform operator: anyone else goes to the console.
   * @param actor the Owner
   * @param memberId the member's membership id in the current Organisation
   * @throws {ConflictException} totp_reset_elsewhere when the admin is the operator or a member elsewhere
   */
  public async resetMember(actor: Actor, memberId: string): Promise<void> {
    const member = await this.memberships.getMemberByIdOrThrow(memberId);

    if (
      (await this.operators.isOperator(member.adminId)) ||
      (await this.memberships.belongsElsewhere(member.adminId))
    ) {
      const code: MemberTotpResetErrorCode = 'totp_reset_elsewhere';

      throw new ConflictException({ code, message: 'The admin has access beyond this Organisation' });
    }

    await this.resetIn(actor, member.adminId, member.id, false);
  }

  /**
   * Turn a locked-out Owner's two-step login off from the console, once the operator checked who they are
   * outside the platform. The console's unit of work never enters an Organisation, so the reset, its audit
   * entry in the Organisation's log and the email commit together in the Organisation's own unit of work,
   * right after the console's.
   * @param actor the operator
   * @param organisationId the Organisation the Owner belongs to
   * @param email the Owner's email
   * @throws {NotFoundException} when no Owner of the Organisation has this email
   */
  public async resetOwner(actor: Actor, organisationId: string, email: string): Promise<void> {
    const admin = await this.admins.getByEmail(email);
    const membership =
      admin === null ? null : await this.memberships.getByOrganisationAndAdmin(organisationId, admin.id);

    if (admin === null || membership === null || !membership.owner) {
      throw new NotFoundException();
    }

    this.unitOfWork.afterCommit(() =>
      this.unitOfWork.run(organisationId, () => this.resetIn(actor, admin.id, membership.id, true)),
    );
  }

  /**
   * Turn an admin's two-step login off and end their sessions, so a session of a lost phone goes too, with
   * the audit entry in the current Organisation and the email; nothing when it was off.
   * @param actor who does it
   * @param adminId the admin
   * @param membershipId their membership in the current Organisation
   * @param byOperator whether the Platform operator does it
   */
  private async resetIn(actor: Actor, adminId: string, membershipId: string, byOperator: boolean): Promise<void> {
    if (!(await this.credentials.remove(adminId))) {
      return;
    }

    await this.sessions.endAllAdmin(adminId);
    await this.audit.record(actor, { action: 'member.reset_totp', target: { type: 'membership', id: membershipId } });
    this.jobs.enqueue(totpResetJob, { adminId, byOperator });
  }

  /**
   * Digest a recovery code as it is stored, bound to its admin.
   * @param adminId the admin
   * @param code the code
   */
  private recoveryDigest(adminId: string, code: string): string {
    return this.encryption.platformDigest(`recovery:${adminId}`, code.toLowerCase());
  }

  /**
   * Use one of an admin's recovery codes, counting a wrong one against their limit like a wrong code.
   * @param adminId the admin
   * @param code the recovery code
   * @throws {HttpException} 429 when the admin entered too many wrong codes; 400 for a wrong or used one
   */
  private async useRecoveryCode(adminId: string, code: string): Promise<void> {
    if ((await this.rateLimiter.take(this.failures, adminId)) === null) {
      throw totpError('totp_throttled');
    }

    if (!(await this.credentials.useRecoveryCode(adminId, this.recoveryDigest(adminId, code), this.clock.now()))) {
      throw totpError('totp_code_invalid');
    }

    this.unitOfWork.afterCommit(() => this.rateLimiter.clear(this.failures, adminId));
  }

  /**
   * Check a code against a credential's secret, counting the attempt against the admin's limit until it
   * matches.
   * @param credential the admin's credential
   * @param code the code from their app
   * @throws {HttpException} 429 when the admin entered too many wrong codes; 400 for a wrong code
   */
  private async checkCode(credential: TotpCredentialEntity, code: string): Promise<number> {
    if ((await this.rateLimiter.take(this.failures, credential.adminId)) === null) {
      throw totpError('totp_throttled');
    }

    const secret = this.encryption.openPlatformSecret(secretContext(credential.adminId), credential.sealedSecret);
    const step = matchTotpStep(secret, code, this.clock.now());

    if (step === null) {
      throw totpError('totp_code_invalid');
    }

    this.unitOfWork.afterCommit(() => this.rateLimiter.clear(this.failures, credential.adminId));

    return step;
  }
}

// The status and message of each refused step.
const REFUSALS: Readonly<Record<TotpErrorCode, { status: HttpStatus; message: string }>> = {
  totp_enabled: { status: HttpStatus.CONFLICT, message: 'TOTP is already on' },
  totp_not_started: { status: HttpStatus.CONFLICT, message: 'No TOTP secret waits for confirmation' },
  totp_not_enabled: { status: HttpStatus.CONFLICT, message: 'TOTP is not on' },
  totp_code_invalid: { status: HttpStatus.BAD_REQUEST, message: 'Wrong or used code' },
  totp_throttled: { status: HttpStatus.TOO_MANY_REQUESTS, message: 'Too many wrong codes, try later' },
};

/**
 * Build a refused step's exception with the code the app translates.
 * @param code the code
 */
function totpError(code: TotpErrorCode): HttpException {
  const { status, message } = REFUSALS[code];

  return new HttpException({ code, message }, status);
}
