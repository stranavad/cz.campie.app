import { Injectable } from '@nestjs/common';

import { Clock } from '../../../../core/ports/clock/clock.port.ts';
import { SessionService } from '../../../../core/sessions/session.service.ts';
import type { AdminEntity } from '../../../../repositories/admins/admin/admin.entity.ts';
import { AdminRepository } from '../../../../repositories/admins/admin/admin.repository.ts';
import { TotpCredentialRepository } from '../../../../repositories/admins/totp-credential/totp-credential.repository.ts';

@Injectable()
export class AdminService {
  constructor(
    private readonly admins: AdminRepository,
    private readonly totpCredentials: TotpCredentialRepository,
    private readonly sessions: SessionService,
    private readonly clock: Clock,
  ) {}

  /**
   * Get an admin by id, or throw if missing.
   * @param id admin id
   */
  public getByIdOrThrow(id: string): Promise<AdminEntity> {
    return this.admins.getByIdOrThrow(id);
  }

  /**
   * Get the admin an email belongs to.
   * @param email the email, lowercase
   */
  public getByEmail(email: string): Promise<AdminEntity | null> {
    return this.admins.getByEmail(email);
  }

  /**
   * Get the id and password hash of the admin an email belongs to; the hash is null until they set one.
   * @param email the email, lowercase
   */
  public getCredentialsByEmail(email: string): Promise<{ id: string; passwordHash: string | null } | null> {
    return this.admins.getCredentialsByEmail(email);
  }

  /**
   * Create an admin identity, in any unit of work: it belongs to no Organisation.
   * @param input the admin's email, their password's hash unless they set one later, and whether the email
   * is proven theirs already, as by the invitation that creates the account
   */
  public create({
    emailVerified = false,
    ...input
  }: {
    email: string;
    passwordHash?: string;
    emailVerified?: boolean;
  }): Promise<AdminEntity> {
    return this.admins.create({ ...input, emailVerifiedAt: emailVerified ? this.clock.now() : null });
  }

  /**
   * Set an admin's password through a link sent to their email, which proves the email theirs, and end
   * every session of the account. An account whose email was never proven may have been made by someone
   * else under it, so its TOTP goes too: a second factor they enrolled must not keep the owner out.
   * @param id admin id
   * @param passwordHash the new password's hash
   */
  public async setPassword(id: string, passwordHash: string): Promise<{ before: AdminEntity; after: AdminEntity }> {
    const before = await this.admins.getByIdOrThrow(id);
    const after = await this.admins.update(id, {
      passwordHash,
      emailVerifiedAt: before.emailVerifiedAt ?? this.clock.now(),
    });

    if (before.emailVerifiedAt === null) {
      await this.totpCredentials.remove(id);
    }

    await this.sessions.endAllAdmin(id);

    return { before, after };
  }

  /**
   * Mark an admin's email verified, unless it already is.
   * @param id admin id
   * @returns the admin before and after, or null when the email was verified already
   */
  public async verifyEmail(id: string): Promise<{ before: AdminEntity; after: AdminEntity } | null> {
    const before = await this.admins.getByIdOrThrow(id);
    const after = await this.admins.verifyEmail(id, this.clock.now());

    return after === null ? null : { before, after };
  }
}
