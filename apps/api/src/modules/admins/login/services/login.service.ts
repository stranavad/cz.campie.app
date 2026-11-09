import { BadRequestException, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { AccountErrorCode, LogInBody, LogInErrorCode } from '@repo/schema/admins';

import type { Env } from '../../../../core/config/env.schema.ts';
import { UnitOfWork } from '../../../../core/database/unit-of-work.ts';
import { verifyPassword } from '../../../../core/passwords/password-hash.ts';
import { addressSubject } from '../../../../core/rate-limits/address-subject.ts';
import { RateLimiter, type RateLimit } from '../../../../core/rate-limits/rate-limiter.ts';
import type { IssuedSession } from '../../../../core/sessions/session-token.ts';
import { SessionService } from '../../../../core/sessions/session.service.ts';
import { AdminService } from '../../admin/services/admin.service.ts';

@Injectable()
export class LoginService {
  private readonly limits: { readonly account: RateLimit; readonly ip: RateLimit };

  constructor(
    private readonly admins: AdminService,
    private readonly sessions: SessionService,
    private readonly rateLimiter: RateLimiter,
    private readonly unitOfWork: UnitOfWork,
    config: ConfigService<Env, true>,
  ) {
    const { perAccount, perIp, lockoutMs } = config.get('loginLimits', { infer: true });

    this.limits = {
      account: { name: 'login-failures-account', max: perAccount, windowMs: lockoutMs },
      ip: { name: 'login-failures-ip', max: perIp, windowMs: lockoutMs },
    };
  }

  /**
   * Sign an admin in by email and password. Every attempt counts against the email's and the IP address's
   * limit until it succeeds; once either limit is reached, attempts are refused without checking the
   * password until the oldest failure leaves the lockout period.
   * @param body the email and password
   * @param ipAddress where the attempt comes from
   * @throws {HttpException} 401 when the email has no account, the account no password, or the password is
   * wrong, all alike
   */
  public async logIn({ email, password }: LogInBody, ipAddress: string): Promise<IssuedSession> {
    const credentials = await this.check(email, password, ipAddress);

    if (credentials === null) {
      throw loginError('credentials_invalid');
    }

    return this.sessions.startAdmin(credentials.id);
  }

  /**
   * Check the current password of a signed-in admin before a change to their account, as a login checks
   * it: a wrong one counts against the same limits, so a session left open does not let anyone guess it.
   * @param email the admin's email, lowercase
   * @param password the password they typed
   * @param ipAddress where the request comes from
   * @throws {HttpException} 429 login_throttled when the email or the IP address has failed too often
   * @throws {BadRequestException} current_password_invalid when the password is wrong or the admin has none
   */
  public async confirmPassword(email: string, password: string, ipAddress: string): Promise<void> {
    if ((await this.check(email, password, ipAddress)) === null) {
      const code: AccountErrorCode = 'current_password_invalid';

      throw new BadRequestException({ code, message: 'The current password is wrong' });
    }
  }

  /**
   * Check an email and password, counting the attempt against the email's and the IP address's limit
   * unless it succeeds.
   * @param email the email, lowercase
   * @param password the password
   * @param ipAddress where the attempt comes from
   * @throws {HttpException} 429 login_throttled when the email or the IP address has failed too often
   * @returns the admin's id, or null when the email has no account, the account no password, or the
   * password is wrong, all alike
   */
  private async check(email: string, password: string, ipAddress: string): Promise<{ id: string } | null> {
    const accountAttempt = await this.rateLimiter.take(this.limits.account, email);

    if (accountAttempt === null) {
      throw loginError('login_throttled');
    }

    const ipAttempt = await this.rateLimiter.take(this.limits.ip, addressSubject(ipAddress));

    if (ipAttempt === null) {
      await accountAttempt.release();

      throw loginError('login_throttled');
    }

    // Unknown or not, one query and one hash, so the answer's timing tells nothing about the account.
    const credentials = await this.admins.getCredentialsByEmail(email);

    if (credentials === null || !(await verifyPassword(password, credentials.passwordHash))) {
      return null;
    }

    // Only once the change is committed: an attempt that fails after all still counts.
    this.unitOfWork.afterCommit(() => ipAttempt.release());
    this.forgetFailures(email);

    return { id: credentials.id };
  }

  /**
   * End the admin session a token opens, if it still exists.
   * @param token the token from the cookie
   */
  public logOut(token: string): Promise<void> {
    return this.sessions.endAdmin(token);
  }

  /**
   * Forget an email's failed logins once the current unit of work commits, as after proving access to it.
   * @param email the email, lowercase
   */
  public forgetFailures(email: string): void {
    this.unitOfWork.afterCommit(() => this.rateLimiter.clear(this.limits.account, email));
  }
}

// The status and message of each refused login.
const REFUSALS: Readonly<Record<LogInErrorCode, { status: HttpStatus; message: string }>> = {
  credentials_invalid: { status: HttpStatus.UNAUTHORIZED, message: 'Wrong email or password' },
  login_throttled: { status: HttpStatus.TOO_MANY_REQUESTS, message: 'Too many failed logins, try later' },
};

/**
 * Build a refused login's exception with the code the app translates.
 * @param code the code
 */
function loginError(code: LogInErrorCode): HttpException {
  const { status, message } = REFUSALS[code];

  return new HttpException({ code, message }, status);
}
