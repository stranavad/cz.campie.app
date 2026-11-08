import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { PasswordResetErrorCode, RequestPasswordResetBody, ResetPasswordBody } from '@repo/schema/admins';
import { passwordProblem, type PasswordErrorCode } from '@repo/schema/shared';

import type { Env } from '../../../../core/config/env.schema.ts';
import { JobQueue } from '../../../../core/jobs/job-queue.ts';
import { hashPassword } from '../../../../core/passwords/password-hash.ts';
import { Clock } from '../../../../core/ports/clock/clock.port.ts';
import { RateLimiter, type RequestLimit } from '../../../../core/rate-limits/rate-limiter.ts';
import { generateSessionToken, hashSessionToken } from '../../../../core/sessions/session-token.ts';
import type { AdminEntity } from '../../../../repositories/admins/admin/admin.entity.ts';
import { PasswordResetRepository } from '../../../../repositories/admins/password-reset/password-reset.repository.ts';
import { AdminService } from '../../admin/services/admin.service.ts';
import { LoginService } from '../../login/services/login.service.ts';
import { passwordResetRequestedJob } from '../password-reset-requested.job.ts';

// Long enough to open the mail, short enough that an old mailbox holds no working link.
export const PASSWORD_RESET_VALID_MINUTES = 60;

@Injectable()
export class PasswordResetService {
  private readonly productName: string;
  private readonly requestLimit: RequestLimit;

  constructor(
    private readonly passwordResets: PasswordResetRepository,
    private readonly admins: AdminService,
    private readonly logins: LoginService,
    private readonly jobs: JobQueue,
    private readonly rateLimiter: RateLimiter,
    private readonly clock: Clock,
    config: ConfigService<Env, true>,
  ) {
    this.productName = config.get('PRODUCT_NAME', { infer: true });
    this.requestLimit = config.get('requestLimits', { infer: true }).passwordReset;
  }

  /**
   * Send a reset link to the admin an email belongs to, once this commits; for an email without an
   * account do nothing, so the caller cannot tell the difference. Both count against the reset limit of
   * the IP address and the email alike.
   * @param body the email
   * @param ipAddress where the request comes from
   */
  public async request({ email }: RequestPasswordResetBody, ipAddress: string): Promise<void> {
    await this.rateLimiter.admit(this.requestLimit, { ipAddress, target: email });

    const admin = await this.admins.getByEmail(email);

    if (admin !== null) {
      this.jobs.enqueue(passwordResetRequestedJob, { adminId: admin.id });
    }
  }

  /**
   * Start a password reset for an admin, replacing any earlier one, so only the newest link works: only
   * the token's hash is stored, the token goes into the link.
   * @param adminId admin id
   */
  public async start(adminId: string): Promise<{ admin: AdminEntity; token: string }> {
    const admin = await this.admins.getByIdOrThrow(adminId);
    const token = generateSessionToken();
    const expiresAt = new Date(this.clock.now().getTime() + PASSWORD_RESET_VALID_MINUTES * 60 * 1000);

    await this.passwordResets.removeByAdmin(adminId);
    await this.passwordResets.create({ adminId, tokenHash: hashSessionToken(token), expiresAt });

    return { admin, token };
  }

  /**
   * Set an admin's new password through a reset link, which then stops working, and end the admin's
   * sessions. Proving access to the email verifies it, clears the TOTP of an account whose email was never
   * verified, and lifts a login lockout.
   * @param body the token from the link and the new password
   * @throws {BadRequestException} when the link is unknown, used or expired, or the password too weak
   */
  public async complete({ token, password }: ResetPasswordBody): Promise<void> {
    const reset = await this.passwordResets.getByTokenHash(hashSessionToken(token));

    if (reset === null || reset.expiresAt <= this.clock.now()) {
      throw resetError('password_reset_invalid');
    }

    const admin = await this.admins.getByIdOrThrow(reset.adminId);
    const problem = passwordProblem(password, { email: admin.email, productName: this.productName });

    if (problem !== null) {
      throw resetError(problem);
    }

    // Hashed before the link is used up, so the slow hash holds no lock a simultaneous use waits for.
    const passwordHash = await hashPassword(password);

    if (!(await this.passwordResets.consume(reset.id))) {
      throw resetError('password_reset_invalid');
    }

    await this.admins.setPassword(admin.id, passwordHash);
    this.logins.forgetFailures(admin.email);
  }
}

/**
 * Build a refused reset's exception with the code the app translates.
 * @param code the code
 */
function resetError(code: PasswordResetErrorCode | PasswordErrorCode): BadRequestException {
  return new BadRequestException({ code, message: `Password reset refused: ${code}` });
}
