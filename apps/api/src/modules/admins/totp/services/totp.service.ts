import { ForbiddenException, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { TotpEnrolment, TotpErrorCode } from '@repo/schema/admins';
import type { AccessErrorCode } from '@repo/schema/shared';

import type { Env } from '../../../../core/config/env.schema.ts';
import { UnitOfWork } from '../../../../core/database/unit-of-work.ts';
import { EncryptionService } from '../../../../core/encryption/encryption.service.ts';
import { Clock } from '../../../../core/ports/clock/clock.port.ts';
import { RateLimiter, type RateLimit } from '../../../../core/rate-limits/rate-limiter.ts';
import type { IssuedSession } from '../../../../core/sessions/session-token.ts';
import { SessionService } from '../../../../core/sessions/session.service.ts';
import { encodeBase32, generateTotpSecret, matchTotpStep, totpUri } from '../../../../core/totp/totp.ts';
import type { TotpCredentialEntity } from '../../../../repositories/admins/totp-credential/totp-credential.entity.ts';
import { TotpCredentialRepository } from '../../../../repositories/admins/totp-credential/totp-credential.repository.ts';
import { OperatorRepository } from '../../../../repositories/operators/operator/operator.repository.ts';
import { AdminService } from '../../admin/services/admin.service.ts';

/**
 * The context an admin's TOTP secret is sealed for, so it opens for that admin only.
 * @param adminId admin id
 */
function secretContext(adminId: string): string {
  return `totp:${adminId}`;
}

// Two-step login with an authenticator app. Only the Platform operator sets it up so far, and must: the
// console admits no session without a code.
@Injectable()
export class TotpService {
  private readonly productName: string;
  private readonly failures: RateLimit;

  constructor(
    private readonly credentials: TotpCredentialRepository,
    private readonly operators: OperatorRepository,
    private readonly admins: AdminService,
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
   * @throws {ForbiddenException} when the admin is not the Platform operator
   * @throws {HttpException} 409 when the admin's TOTP is already on
   */
  public async startEnrolment(adminId: string): Promise<TotpEnrolment> {
    if (!(await this.operators.isOperator(adminId))) {
      const code: AccessErrorCode = 'not_operator';

      throw new ForbiddenException({ code, message: 'Only the Platform operator sets up TOTP so far' });
    }

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
  public async confirmEnrolment(adminId: string, sessionId: string, code: string): Promise<IssuedSession> {
    const credential = await this.credentials.getByAdmin(adminId);

    if (credential === null) {
      throw totpError('totp_not_started');
    }

    if (credential.confirmed) {
      throw totpError('totp_enabled');
    }

    const step = await this.checkCode(credential, code);

    if (!(await this.credentials.confirm(adminId, step, this.clock.now()))) {
      throw totpError('totp_enabled');
    }

    return this.sessions.passSecondFactor(sessionId);
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

    const step = await this.checkCode(credential, code);

    // A code seen already, perhaps by someone looking over a shoulder, counts as wrong.
    if (!(await this.credentials.useStep(adminId, step))) {
      throw totpError('totp_code_invalid');
    }

    return this.sessions.passSecondFactor(sessionId);
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
