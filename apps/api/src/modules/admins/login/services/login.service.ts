import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { LogInBody, LogInErrorCode } from '@repo/schema/admins';

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
   * @throws {HttpException} 429 when the email or the IP address has failed too often; 401 when the email
   * has no account, the account no password, or the password is wrong, all alike
   */
  public async logIn({ email, password }: LogInBody, ipAddress: string): Promise<IssuedSession> {
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
      throw loginError('credentials_invalid');
    }

    // Only once the session is committed: a login that fails after all still counts.
    this.unitOfWork.afterCommit(() => ipAttempt.release());
    this.forgetFailures(email);

    return this.sessions.startAdmin(credentials.id);
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
