import { Injectable } from '@nestjs/common';

import type { FullName, Person } from '@repo/schema/shared';

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
   * else under it, so its TOTP goes too: a second factor they enrolled must not keep the owner out.
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
    const after = await this.admins.update(id, {
      passwordHash,
      emailVerifiedAt: before.emailVerifiedAt ?? this.clock.now(),
      ...name,
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
