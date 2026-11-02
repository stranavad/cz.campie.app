import { isDeepStrictEqual } from 'node:util';
import { ConflictException, Injectable } from '@nestjs/common';

import type { MemberErrorCode, Permissions, UpdateMemberBody } from '@repo/schema/admins';

import type { Actor } from '../../../../core/audit/actor.ts';
import { AuditService } from '../../../../core/audit/audit.service.ts';
import { UnitOfWork } from '../../../../core/database/unit-of-work.ts';
import { JobQueue } from '../../../../core/jobs/job-queue.ts';
import type { JobPayload } from '../../../../core/jobs/job.ts';
import type { MemberEntity } from '../../../../repositories/admins/member/member.entity.ts';
import type { MembershipEntity } from '../../../../repositories/admins/membership/membership.entity.ts';
import { MembershipRepository } from '../../../../repositories/admins/membership/membership.repository.ts';
import { OrganisationRepository } from '../../../../repositories/organisations/organisation/organisation.repository.ts';
import { AdminService } from '../../admin/services/admin.service.ts';
import type { OwnerChangedProps } from '../owner-changed.email.tsx';
import { ownerChangedJob, type OwnerChange } from '../owner-changed.job.ts';

@Injectable()
export class MembershipService {
  constructor(
    private readonly memberships: MembershipRepository,
    private readonly audit: AuditService,
    private readonly jobs: JobQueue,
    private readonly admins: AdminService,
    private readonly organisations: OrganisationRepository,
    private readonly unitOfWork: UnitOfWork,
  ) {}

  /**
   * Get an admin's membership in an Organisation.
   * @param organisationId Organisation id
   * @param adminId admin id
   */
  public getByOrganisationAndAdmin(organisationId: string, adminId: string): Promise<MembershipEntity | null> {
    return this.memberships.getByOrganisationAndAdmin(organisationId, adminId);
  }

  /**
   * Make an admin a member of the current Organisation, audited.
   * @param actor who does it
   * @param input the admin, whether they become an Owner, and their level per area, none where left out
   */
  public async create(
    actor: Actor,
    input: { adminId: string; owner: boolean; permissions?: Permissions },
  ): Promise<MembershipEntity> {
    const membership = await this.memberships.create(input);

    await this.audit.record(actor, {
      action: 'membership.create',
      target: { type: 'membership', id: membership.id },
      change: { before: null, after: membership },
    });

    return membership;
  }

  /**
   * List the current Organisation's members with their emails.
   */
  public listMembers(): Promise<MemberEntity[]> {
    return this.memberships.listMembers();
  }

  /**
   * Change a member's levels or Owner role, audited, effective from their next request. A promotion or
   * demotion is emailed to every Owner, the demoted one included.
   * @param actor the Owner who does it
   * @param memberId membership id
   * @param body what changes
   * @throws {ConflictException} when it would leave the Organisation without an Owner
   */
  public async update(actor: Actor, memberId: string, body: UpdateMemberBody): Promise<MemberEntity> {
    const before = await this.memberships.getMemberByIdOrThrow(memberId);

    await this.memberships.update(memberId, body);
    await this.requireAnOwner();

    const after = await this.memberships.getMemberByIdOrThrow(memberId);

    if (before.owner === after.owner && isDeepStrictEqual(before.permissions, after.permissions)) {
      return after;
    }

    await this.audit.record(actor, {
      action: 'membership.update',
      target: { type: 'membership', id: memberId },
      change: { before, after },
    });

    if (before.owner !== after.owner) {
      await this.notifyOwners(actor, after.adminId, after.owner ? 'promoted' : 'demoted');
    }

    return after;
  }

  /**
   * Remove a member, audited; their next request is refused. Removing an Owner is emailed to every Owner,
   * the removed one included.
   * @param actor the Owner who does it
   * @param memberId membership id
   */
  public async remove(actor: Actor, memberId: string): Promise<void> {
    const before = await this.memberships.getMemberByIdOrThrow(memberId);

    await this.memberships.remove(memberId);
    await this.requireAnOwner();

    await this.audit.record(actor, {
      action: 'membership.remove',
      target: { type: 'membership', id: memberId },
      change: { before, after: null },
    });

    if (before.owner) {
      await this.notifyOwners(actor, before.adminId, 'removed');
    }
  }

  /**
   * Gather what the email about a change of Owners tells one recipient, in the job's Organisation.
   * @param payload the job's recipient, the admin whose role changed, the change and who made it
   */
  public async ownerChangeNotice({
    recipientId,
    adminId,
    change,
    changedById,
  }: JobPayload<typeof ownerChangedJob>): Promise<{ to: string; props: OwnerChangedProps }> {
    const recipient = await this.admins.getByIdOrThrow(recipientId);
    const admin = await this.admins.getByIdOrThrow(adminId);
    const changedBy = changedById === null ? null : await this.admins.getByIdOrThrow(changedById);
    const organisation = await this.organisations.getByIdOrThrow(this.unitOfWork.organisationId);

    return {
      to: recipient.email,
      props: {
        organisation: organisation.displayName,
        email: admin.email,
        change,
        changedBy: changedBy?.email ?? null,
      },
    };
  }

  /**
   * Refuse a change that leaves the current Organisation without an Owner, before its commit would.
   * @throws {ConflictException} when no Owner is left
   */
  private async requireAnOwner(): Promise<void> {
    if (!(await this.memberships.keepsAnOwner())) {
      const code: MemberErrorCode = 'last_owner';

      throw new ConflictException({ code, message: 'An Organisation keeps at least one Owner' });
    }
  }

  /**
   * Email every Owner, and the admin who stopped being one, about a change of Owners once it commits: one
   * job per recipient, so a retry never repeats a mail that went out.
   * @param actor who made the change
   * @param adminId the admin whose role changed
   * @param change what happened to them
   */
  private async notifyOwners(actor: Actor, adminId: string, change: OwnerChange): Promise<void> {
    const recipients = new Set(await this.memberships.listOwnerIds());
    recipients.add(adminId);

    for (const recipientId of recipients) {
      this.jobs.enqueue(ownerChangedJob, {
        recipientId,
        adminId,
        change,
        // Only an admin's identity is an admin id the email can name.
        changedById: actor.kind === 'admin' ? actor.identity : null,
      });
    }
  }
}
