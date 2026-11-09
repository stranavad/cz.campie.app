import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type {
  AcceptInvitationBody,
  CreateInvitationBody,
  Invitation,
  InvitationErrorCode,
  InvitationPreview,
} from '@repo/schema/admins';
import { passwordProblem, type FullName, type PasswordErrorCode } from '@repo/schema/shared';

import type { Actor } from '../../../../core/audit/actor.ts';
import { AuditService } from '../../../../core/audit/audit.service.ts';
import type { Env } from '../../../../core/config/env.schema.ts';
import { UnitOfWork } from '../../../../core/database/unit-of-work.ts';
import { JobQueue } from '../../../../core/jobs/job-queue.ts';
import { hashPassword } from '../../../../core/passwords/password-hash.ts';
import { Clock } from '../../../../core/ports/clock/clock.port.ts';
import { generateSessionToken, hashSessionToken, type IssuedSession } from '../../../../core/sessions/session-token.ts';
import { SessionService } from '../../../../core/sessions/session.service.ts';
import type { InvitationEntity } from '../../../../repositories/admins/invitation/invitation.entity.ts';
import { InvitationRepository } from '../../../../repositories/admins/invitation/invitation.repository.ts';
import { OrganisationRepository } from '../../../../repositories/organisations/organisation/organisation.repository.ts';
import { AdminService } from '../../admin/services/admin.service.ts';
import { LoginService } from '../../login/services/login.service.ts';
import { MembershipService } from '../../membership/services/membership.service.ts';
import { invitationCreatedJob } from '../invitation-created.job.ts';

// Long enough for a volunteer who reads mail at the weekend, short enough that a forgotten one lapses.
export const INVITATION_VALID_DAYS = 7;

const DAY_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class InvitationService {
  private readonly productName: string;

  constructor(
    private readonly invitations: InvitationRepository,
    private readonly organisations: OrganisationRepository,
    private readonly admins: AdminService,
    private readonly logins: LoginService,
    private readonly memberships: MembershipService,
    private readonly audit: AuditService,
    private readonly sessions: SessionService,
    private readonly jobs: JobQueue,
    private readonly unitOfWork: UnitOfWork,
    private readonly clock: Clock,
    config: ConfigService<Env, true>,
  ) {
    this.productName = config.get('PRODUCT_NAME', { infer: true });
  }

  /**
   * List the current Organisation's invitations not yet accepted, each with the Owner who last sent it.
   */
  public async list(): Promise<Invitation[]> {
    return this.show(await this.invitations.list());
  }

  /**
   * Invite an email to the current Organisation with levels, audited, and email the link once this
   * commits. Inviting the same email again replaces the earlier invitation: its levels, its sender, and its
   * link, which stops working at once.
   * @param actor the Owner who invites
   * @param body the email and the levels the invitee gets
   * @throws {ConflictException} when the email already belongs to a member
   */
  public async invite(actor: Actor, { email, permissions }: CreateInvitationBody): Promise<Invitation> {
    const admin = await this.admins.getByEmail(email);

    if (
      admin !== null &&
      (await this.memberships.getByOrganisationAndAdmin(this.unitOfWork.organisationId, admin.id)) !== null
    ) {
      throw invitationError(ConflictException, 'already_member');
    }

    const before = await this.invitations.getByEmail(email);
    const sent = { invitedByAdminId: actor.kind === 'admin' ? actor.identity : null, ...this.sending() };
    const after =
      before === null
        ? await this.invitations.create({ email, permissions, ...sent })
        : await this.invitations.update(before.id, { permissions, tokenHash: null, ...sent });

    await this.audit.record(actor, {
      action: before === null ? 'invitation.create' : 'invitation.update',
      target: { type: 'invitation', id: after.id },
      change: { before, after },
    });

    this.jobs.enqueue(invitationCreatedJob, { invitationId: after.id });

    return after.toDto(sent.invitedByAdminId === null ? null : await this.admins.getPersonById(sent.invitedByAdminId));
  }

  /**
   * Revoke an invitation of the current Organisation, audited, so its link stops working.
   * @param actor the Owner who revokes it
   * @param id invitation id
   */
  public async revoke(actor: Actor, id: string): Promise<void> {
    const before = await this.invitations.getById(id);

    await this.invitations.remove(id);

    await this.audit.record(actor, {
      action: 'invitation.remove',
      target: { type: 'invitation', id },
      change: { before, after: null },
    });
  }

  /**
   * Make an invitation's link, valid from now: only the token's hash is stored, the token goes into the
   * email. Null when the invitation was revoked or accepted meanwhile.
   * @param id invitation id, in the current Organisation
   */
  public async start(id: string): Promise<{ email: string; organisation: string; token: string } | null> {
    if ((await this.invitations.getById(id)) === null) {
      return null;
    }

    const token = generateSessionToken();
    const invitation = await this.invitations.update(id, { tokenHash: hashSessionToken(token), ...this.sending() });
    const organisation = await this.organisations.getByIdOrThrow(invitation.organisationId);

    return { email: invitation.email, organisation: organisation.displayName, token };
  }

  /**
   * Read an invitation by its link's token, for the page the link opens.
   * @param token the token from the link
   */
  public async lookUp(token: string): Promise<InvitationPreview> {
    const invitation = await this.getValidOrThrow(token);
    const organisation = await this.organisations.getByIdOrThrow(invitation.organisationId);
    const admin = await this.admins.getByEmail(invitation.email);
    const inviter =
      invitation.invitedByAdminId === null ? null : await this.admins.getPersonById(invitation.invitedByAdminId);

    return {
      email: invitation.email,
      organisation: { displayName: organisation.displayName },
      // By name only: the link's holder learns who invited them, not the Owner's email.
      invitedBy:
        inviter === null || inviter.firstName === null || inviter.lastName === null
          ? null
          : { firstName: inviter.firstName, lastName: inviter.lastName },
      permissions: invitation.permissions,
      // An account whose email was never verified may be someone else's: the invitee takes it over with a
      // new password, as if there were none.
      hasAccount: admin !== null && admin.emailVerifiedAt !== null,
    };
  }

  /**
   * Accept an invitation through its link, once, in a platform unit of work that then enters the
   * invitation's Organisation: the invitee becomes a member with the invited levels, audited as them. The
   * link proves the email is the invitee's, not that an account under it is: an account whose email was
   * verified joins as it is and signs in as usual. Any other is taken over: the invitee sets its password,
   * its sessions and TOTP end, and they are signed in, as with an email without an account, which gets one.
   * @param body the token from the link, and the password and name unless the account's email is verified
   * @param ipAddress where the invitee acts from
   * @throws {BadRequestException} when the link is unknown, used or expired, or a needed password is
   * missing or too weak, or a needed name missing
   */
  public async accept(
    { token, password, firstName, lastName }: AcceptInvitationBody,
    ipAddress: string,
  ): Promise<IssuedSession | null> {
    const read = await this.getValidOrThrow(token);
    const existing = await this.admins.getByEmail(read.email);
    const verified = existing !== null && existing.emailVerifiedAt !== null;
    const passwordHash = verified ? undefined : await this.newPasswordHash(read.email, password);
    // Asked with the password: whoever sets the password names the account, a verified one keeps its name.
    const name = verified ? undefined : requireName(firstName, lastName);
    // Its levels as it is used up, not as first read: an Owner may have replaced it meanwhile.
    const invitation = await this.invitations.consumeByTokenHash(hashSessionToken(token));

    if (invitation === null) {
      throw invitationError(BadRequestException, 'invitation_invalid');
    }

    await this.unitOfWork.enter(invitation.organisationId);
    const admin =
      existing ?? (await this.admins.create({ email: invitation.email, passwordHash, emailVerified: true, name }));
    const actor: Actor = { kind: 'admin', identity: admin.id, ipAddress };

    if (existing === null) {
      await this.audit.record(actor, {
        action: 'admin.create',
        target: { type: 'admin', id: admin.id },
        change: { before: null, after: admin },
      });
    } else if (passwordHash !== undefined) {
      // A password was required, so the account's email was never verified: the invitee takes it over.
      const { before, after } = await this.admins.setPassword(admin.id, passwordHash, name);
      // The name it had was given by whoever made the account, perhaps in another Organisation: it stays
      // out of this one's log, which records only the name the invitee gave.
      const { firstName: _firstName, lastName: _lastName, ...unnamed } = before;

      await this.audit.record(actor, {
        action: 'admin.replace_credentials',
        target: { type: 'admin', id: admin.id },
        change: { before: unnamed, after },
      });
    }

    if (passwordHash !== undefined) {
      // Like a reset link, the invitation proves the email: failed logins run up against it before count no more.
      this.logins.forgetFailures(invitation.email);
    }

    await this.audit.record(actor, {
      action: 'invitation.accept',
      target: { type: 'invitation', id: invitation.id },
      change: { before: invitation, after: null },
    });

    if ((await this.memberships.getByOrganisationAndAdmin(invitation.organisationId, admin.id)) === null) {
      await this.memberships.create(actor, { adminId: admin.id, owner: false, permissions: invitation.permissions });
    }

    return verified ? null : this.sessions.startAdmin(admin.id);
  }

  /**
   * Get the invitation a link's token opens, if it has not expired.
   * @param token the token from the link
   * @throws {BadRequestException} when the link is unknown, used or expired
   */
  private async getValidOrThrow(token: string): Promise<InvitationEntity> {
    const invitation = await this.invitations.getByTokenHash(hashSessionToken(token));

    if (invitation === null || invitation.expiresAt <= this.clock.now()) {
      throw invitationError(BadRequestException, 'invitation_invalid');
    }

    return invitation;
  }

  /**
   * Check and hash the password of a new or taken over account. Hashed before the link is used up, so the
   * slow hash holds no lock a simultaneous use waits for.
   * @param email the account's email
   * @param password the password the invitee chose, if any
   * @throws {BadRequestException} when it is missing or too weak
   */
  private async newPasswordHash(email: string, password: string | undefined): Promise<string> {
    if (password === undefined) {
      throw invitationError(BadRequestException, 'password_required');
    }

    const problem = passwordProblem(password, { email, productName: this.productName });

    if (problem !== null) {
      throw invitationError(BadRequestException, problem);
    }

    return hashPassword(password);
  }

  /**
   * Show invitations as Owners see them, each with the Owner who last sent it.
   * @param invitations the invitations
   */
  private async show(invitations: readonly InvitationEntity[]): Promise<Invitation[]> {
    const people = await this.admins.listPeopleByIds([
      ...new Set(invitations.flatMap(({ invitedByAdminId }) => invitedByAdminId ?? [])),
    ]);

    return invitations.map((invitation) =>
      invitation.toDto(invitation.invitedByAdminId === null ? null : (people.get(invitation.invitedByAdminId) ?? null)),
    );
  }

  /**
   * Stamp a link sent now: when it went out, and its expiry.
   */
  private sending(): { sentAt: Date; expiresAt: Date } {
    const sentAt = this.clock.now();

    return { sentAt, expiresAt: new Date(sentAt.getTime() + INVITATION_VALID_DAYS * DAY_MS) };
  }
}

/**
 * Require the name of a new or taken over account.
 * @param firstName the first name the invitee gave, if any
 * @param lastName the last name the invitee gave, if any
 * @throws {BadRequestException} when either is missing
 */
function requireName(firstName: string | undefined, lastName: string | undefined): FullName {
  if (firstName === undefined || lastName === undefined) {
    throw invitationError(BadRequestException, 'name_required');
  }

  return { firstName, lastName };
}

/**
 * Build a refused invitation's exception with the code the app translates.
 * @param Exception the HTTP exception
 * @param code the code
 */
function invitationError(
  Exception: typeof BadRequestException | typeof ConflictException,
  code: InvitationErrorCode | PasswordErrorCode,
): BadRequestException | ConflictException {
  return new Exception({ code, message: `Invitation refused: ${code}` });
}
