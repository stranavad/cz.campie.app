import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';

import type { GrantSupportAccessBody, SupportGrant } from '@repo/schema/organisations';
import type { Person } from '@repo/schema/shared';

import type { MemberAccess } from '../../../../core/access/permission.ts';
import type { Actor } from '../../../../core/audit/actor.ts';
import { AuditService } from '../../../../core/audit/audit.service.ts';
import { UnitOfWork } from '../../../../core/database/unit-of-work.ts';
import { Clock } from '../../../../core/ports/clock/clock.port.ts';
import { OrganisationRepository } from '../../../../repositories/organisations/organisation/organisation.repository.ts';
import {
  SupportGrantRepository,
  type SupportGrantRow,
} from '../../../../repositories/organisations/support-grant/support-grant.repository.ts';
import { AdminService } from '../../../admins/admin/services/admin.service.ts';

const HOUR_MS = 60 * 60 * 1000;

// Owners letting the Platform operator in for support, for a while and read-only unless they allow
// changes; every grant, revocation and entry is in the Organisation's audit log. Permission (Owners, or
// the operator entering) is the route's.
@Injectable()
export class SupportAccessService {
  constructor(
    private readonly grants: SupportGrantRepository,
    private readonly organisations: OrganisationRepository,
    private readonly audit: AuditService,
    private readonly admins: AdminService,
    private readonly unitOfWork: UnitOfWork,
    private readonly clock: Clock,
  ) {}

  /**
   * List the current Organisation's grants, newest first, each with the Owner who granted it.
   */
  public async list(): Promise<SupportGrant[]> {
    return this.show(await this.grants.listOfCurrent(), this.clock.now());
  }

  /**
   * Grant the Platform operator access for some hours, ending a grant in force, audited.
   * @param actor the Owner
   * @param body how long, and whether changes are allowed
   */
  public async grant(actor: Actor, body: GrantSupportAccessBody): Promise<SupportGrant> {
    if (actor.kind !== 'admin') {
      throw new ForbiddenException();
    }

    const now = this.clock.now();

    // Grants of one Organisation change one at a time, so two at once never leave two in force.
    await this.organisations.getByIdForUpdate(this.unitOfWork.organisationId);
    await this.revokeAll(actor, now);
    const grant = await this.grants.create({
      grantedByAdminId: actor.identity,
      allowWrites: body.allowWrites,
      grantedAt: now,
      expiresAt: new Date(now.getTime() + body.hours * HOUR_MS),
    });

    await this.audit.record(actor, {
      action: 'support_access.grant',
      target: { type: 'organisation', id: this.unitOfWork.organisationId },
      change: { before: null, after: grant },
    });

    return this.showOne(grant, now);
  }

  /**
   * End a grant at once, audited.
   * @param actor the Owner
   * @param grantId grant id
   * @throws {NotFoundException} when the Organisation has no such grant
   */
  public async revoke(actor: Actor, grantId: string): Promise<SupportGrant> {
    const now = this.clock.now();

    await this.organisations.getByIdForUpdate(this.unitOfWork.organisationId);
    const [revoked] = await this.grants.revoke(now, grantId);
    const grant = revoked ?? (await this.grants.getOfCurrent(grantId));

    if (grant === null) {
      throw new NotFoundException();
    }

    if (revoked !== undefined) {
      await this.audit.record(actor, {
        action: 'support_access.revoke',
        target: { type: 'organisation', id: this.unitOfWork.organisationId },
        change: { before: null, after: revoked },
      });
    }

    return this.showOne(grant, now);
  }

  /**
   * Record that the Platform operator's session entered the Organisation under its grant, in the
   * Organisation's log once per session and grant; the access guard lets nothing else through before it.
   * @param actor the operator
   * @param member their access under the grant
   * @throws {ForbiddenException} when a member, not the operator under a grant, calls it
   */
  public async enter(actor: Actor, member: MemberAccess): Promise<void> {
    if (actor.kind !== 'operator' || member.support === undefined) {
      throw new ForbiddenException();
    }

    if (await this.grants.recordEntry(member.support.grantId, member.support.sessionId, this.clock.now())) {
      await this.audit.record(actor, {
        action: 'support_access.enter',
        target: { type: 'organisation', id: this.unitOfWork.organisationId },
      });
    }
  }

  /**
   * End every grant in force, each audited.
   * @param actor the Owner
   * @param now the time now
   */
  private async revokeAll(actor: Actor, now: Date): Promise<void> {
    for (const revoked of await this.grants.revoke(now)) {
      await this.audit.record(actor, {
        action: 'support_access.revoke',
        target: { type: 'organisation', id: this.unitOfWork.organisationId },
        change: { before: null, after: revoked },
      });
    }
  }

  /**
   * Show grants as Owners see them, each with the Owner who granted it as they are named now.
   * @param grants the grants
   * @param now the time now
   */
  private async show(grants: readonly SupportGrantRow[], now: Date): Promise<SupportGrant[]> {
    const people = await this.admins.listPeopleByIds([
      ...new Set(grants.map(({ grantedByAdminId }) => grantedByAdminId)),
    ]);

    return grants.map((grant) => present(grant, now, people.get(grant.grantedByAdminId) ?? null));
  }

  /**
   * Show one grant as Owners see it.
   * @param grant the grant
   * @param now the time now
   */
  private async showOne(grant: SupportGrantRow, now: Date): Promise<SupportGrant> {
    return present(grant, now, await this.admins.getPersonById(grant.grantedByAdminId));
  }
}

/**
 * Shape a grant for Owners.
 * @param grant the grant
 * @param now the time now
 * @param grantedBy the Owner who granted it, if their account is still there
 */
function present(grant: SupportGrantRow, now: Date, grantedBy: Person | null): SupportGrant {
  return {
    id: grant.id,
    allowWrites: grant.allowWrites,
    grantedAt: grant.grantedAt.toISOString(),
    expiresAt: grant.expiresAt.toISOString(),
    revokedAt: grant.revokedAt?.toISOString() ?? null,
    active: grant.revokedAt === null && grant.expiresAt > now,
    grantedBy,
  };
}
