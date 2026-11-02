import { Injectable } from '@nestjs/common';

import type { AdminSessionEntity } from '../../repositories/sessions/admin-session/admin-session.entity.ts';
import { AdminSessionRepository } from '../../repositories/sessions/admin-session/admin-session.repository.ts';
import type { GuardianSessionEntity } from '../../repositories/sessions/guardian-session/guardian-session.entity.ts';
import { GuardianSessionRepository } from '../../repositories/sessions/guardian-session/guardian-session.repository.ts';
import { Clock } from '../ports/clock/clock.port.ts';
import { generateSessionToken, hashSessionToken, type IssuedSession } from './session-token.ts';

// Fixed lifetimes, not extended by use: a working day for an admin, who reaches health data; a week for a
// guardian, who logs in by an emailed link and comes back now and then.
const ADMIN_SESSION_MS = 12 * 60 * 60 * 1000;
const GUARDIAN_SESSION_MS = 7 * 24 * 60 * 60 * 1000;

@Injectable()
export class SessionService {
  constructor(
    private readonly adminSessions: AdminSessionRepository,
    private readonly guardianSessions: GuardianSessionRepository,
    private readonly clock: Clock,
  ) {}

  /**
   * Start a session for an admin, in any unit of work: it belongs to no Organisation.
   * @param adminId admin id
   */
  public async startAdmin(adminId: string): Promise<IssuedSession> {
    const token = generateSessionToken();
    const expiresAt = this.expiry(ADMIN_SESSION_MS);

    await this.adminSessions.create({ adminId, tokenHash: hashSessionToken(token), expiresAt });

    return { token, expiresAt };
  }

  /**
   * End the admin session a token opens.
   * @param token the token from the cookie
   */
  public async endAdmin(token: string): Promise<void> {
    await this.adminSessions.removeByTokenHash(hashSessionToken(token));
  }

  /**
   * Replace an admin session that passed a TOTP code with a new one that holds it, until the old one would
   * have expired. A new token, so a copy of the old cookie taken before the code gains nothing.
   * @param sessionId the session that passed the code
   */
  public async passSecondFactor(sessionId: string): Promise<IssuedSession> {
    const passed = await this.adminSessions.remove(sessionId);
    const token = generateSessionToken();

    await this.adminSessions.create({
      adminId: passed.adminId,
      tokenHash: hashSessionToken(token),
      expiresAt: passed.expiresAt,
      secondFactor: true,
    });

    return { token, expiresAt: passed.expiresAt };
  }

  /**
   * End every session of an admin, wherever they are signed in.
   * @param adminId admin id
   */
  public async endAllAdmin(adminId: string): Promise<void> {
    await this.adminSessions.removeByAdmin(adminId);
  }

  /**
   * Start a session for a guardian, bound to the current Organisation.
   * @param email the guardian's email
   */
  public async startGuardian(email: string): Promise<IssuedSession> {
    const token = generateSessionToken();
    const expiresAt = this.expiry(GUARDIAN_SESSION_MS);

    await this.guardianSessions.create({ email, tokenHash: hashSessionToken(token), expiresAt });

    return { token, expiresAt };
  }

  /**
   * Get the unexpired admin session a token opens.
   * @param token the token from the cookie
   */
  public async getAdmin(token: string): Promise<AdminSessionEntity | null> {
    const session = await this.adminSessions.getByTokenHash(hashSessionToken(token));

    return session !== null && this.isLive(session.expiresAt) ? session : null;
  }

  /**
   * Get the unexpired guardian session a token opens in the current Organisation; a session of any other
   * Organisation is invisible here.
   * @param token the token from the cookie
   */
  public async getGuardian(token: string): Promise<GuardianSessionEntity | null> {
    const session = await this.guardianSessions.getByTokenHash(hashSessionToken(token));

    return session !== null && this.isLive(session.expiresAt) ? session : null;
  }

  /**
   * Compute when a session started now expires.
   * @param lifetime the session's lifetime in milliseconds
   */
  private expiry(lifetime: number): Date {
    return new Date(this.clock.now().getTime() + lifetime);
  }

  /**
   * Tell whether a session's expiry is still ahead.
   * @param expiresAt the session's expiry
   */
  private isLive(expiresAt: Date): boolean {
    return expiresAt > this.clock.now();
  }
}
