import { Injectable } from '@nestjs/common';

import type { FullName, Person } from '@repo/schema/shared';

import { Clock } from '../../../../core/ports/clock/clock.port.ts';
import { SessionService } from '../../../../core/sessions/session.service.ts';
import type { AdminEntity } from '../../../../repositories/admins/admin/admin.entity.ts';
import { AdminRepository } from '../../../../repositories/admins/admin/admin.repository.ts';
import { EmailChangeRepository } from '../../../../repositories/admins/email-change/email-change.repository.ts';
import { TotpCredentialRepository } from '../../../../repositories/admins/totp-credential/totp-credential.repository.ts';

@Injectable()
export class AdminService {
  constructor(
    private readonly admins: AdminRepository,
    private readonly totpCredentials: TotpCredentialRepository,
    private readonly emailChanges: EmailChangeRepository,
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
   * List admins by their email and name.
   * @param ids admin ids
   * @returns each admin by id; an unknown id is missing
   */
  public listPeopleByIds(ids: readonly string[]): Promise<Map<string, Person>> {
    return this.admins.listPeopleByIds(ids);
  }

  /**
   * Get an admin by their email and name.
   * @param id admin id
   * @returns the admin, or null when their account is gone
   */
  public async getPersonById(id: string): Promise<Person | null> {
    return (await this.admins.listPeopleByIds([id])).get(id) ?? null;
  }

  /**
   * Create an admin identity, in any unit of work: it belongs to no Organisation.
   * @param input the admin's email, their name unless they give it later, their password's hash unless they
   * set one later, and whether the email is proven theirs already, as by the invitation that creates the account
   */
  public create({
    emailVerified = false,
    name,
    ...input
  }: {
    email: string;
    passwordHash?: string;
    emailVerified?: boolean;
    name?: FullName;
  }): Promise<AdminEntity> {
    return this.admins.create({ ...input, ...name, emailVerifiedAt: emailVerified ? this.clock.now() : null });
  }

  /**
   * Set an admin's password through a link sent to their email, which proves the email theirs, and end
   * every session of the account. An account whose email was never proven may have been made by someone
   * else under it, so its TOTP goes too: a second factor they enrolled must not keep the owner out. So does
   * the name they gave it, unless the owner gives one now; an account without a password yet was made by
   * the operator command line, whose name the operator typed, and keeps it. A waiting email change ends too,
   * or its maker would take the account back by following its link.
   * @param id admin id
   * @param passwordHash the new password's hash
   * @param name the name the owner gives, replacing one given by whoever made the account, if any
   */
  public async setPassword(
    id: string,
    passwordHash: string,
    name?: FullName,
  ): Promise<{ before: AdminEntity; after: AdminEntity }> {
    const before = await this.admins.getByIdOrThrow(id);
    const credentials = await this.admins.getCredentialsByEmail(before.email);
    const planted = before.emailVerifiedAt === null && (credentials?.passwordHash ?? null) !== null;
    const after = await this.admins.update(id, {
      passwordHash,
      emailVerifiedAt: before.emailVerifiedAt ?? this.clock.now(),
      ...(planted ? { firstName: null, lastName: null } : {}),
      ...name,
    });

    if (before.emailVerifiedAt === null) {
      await this.totpCredentials.remove(id);
    }

    await this.emailChanges.removeWaiting(id);
    await this.sessions.endAllAdmin(id);

    return { before, after };
  }

  /**
   * Change an admin's password from a session of theirs, ending every other session of the account and a
   * waiting email change, which whoever knew the old password may have asked for.
   * @param id admin id
   * @param sessionId the session that stays
   * @param passwordHash the new password's hash
   */
  public async changePassword(id: string, sessionId: string, passwordHash: string): Promise<void> {
    await this.admins.update(id, { passwordHash });
    await this.emailChanges.removeWaiting(id);
    await this.sessions.endOtherAdmin(id, sessionId);
  }

  /**
   * Change an admin's email to one just proven theirs through a link sent to it, which verifies it.
   * @param id admin id
   * @param email the new email, lowercase
   */
  public async changeEmail(id: string, email: string): Promise<{ before: AdminEntity; after: AdminEntity }> {
    const before = await this.admins.getByIdOrThrow(id);
    const after = await this.admins.update(id, { email, emailVerifiedAt: this.clock.now() });

    return { before, after };
  }

  /**
   * Set an admin's first and last name.
   * @param id admin id
   * @param name the new name
   */
  public async rename(id: string, name: FullName): Promise<{ before: AdminEntity; after: AdminEntity }> {
    const before = await this.admins.getByIdOrThrow(id);
    const after = await this.admins.update(id, name);

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
