import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { ConsoleErrorCode } from '@repo/schema/console';
import { subdomainProblem, type OrganisationStatus, type SubdomainErrorCode } from '@repo/schema/organisations';

import { OrganisationHostCache } from '../../../../core/access/organisation-host-cache.ts';
import type { Actor } from '../../../../core/audit/actor.ts';
import { AuditService } from '../../../../core/audit/audit.service.ts';
import type { Env } from '../../../../core/config/env.schema.ts';
import { violatedConstraint } from '../../../../core/database/constraint-violation.ts';
import { AdminRepository } from '../../../../repositories/admins/admin/admin.repository.ts';
import { MembershipRepository } from '../../../../repositories/admins/membership/membership.repository.ts';
import {
  MailStatisticsRepository,
  type MailCounts,
} from '../../../../repositories/emails/mail-statistics/mail-statistics.repository.ts';
import type { OrganisationEntity } from '../../../../repositories/organisations/organisation/organisation.entity.ts';
import {
  OrganisationRepository,
  type ConsoleChange,
} from '../../../../repositories/organisations/organisation/organisation.repository.ts';

// The code of a change refused because the Organisation no longer has the status it needs.
const NOT_IN_STATUS: Readonly<Record<OrganisationStatus, ConsoleErrorCode | null>> = {
  pending: 'organisation_not_pending',
  approved: 'organisation_not_approved',
  suspended: null,
};

// The Platform operator's work on Organisations, in the console's unit of work: platform tables only,
// audited in the platform's log, since a rejected Organisation's own log goes with it.
// An Organisation as the console lists it, with its mail counts.
export interface ConsoleOrganisationView {
  readonly organisation: OrganisationEntity;
  readonly mail: MailCounts;
}

const NO_MAIL: MailCounts = { sent: 0, skipped: 0, bounced: 0, complained: 0 };

@Injectable()
export class ConsoleOrganisationService {
  private readonly productName: string;

  constructor(
    private readonly organisations: OrganisationRepository,
    private readonly memberships: MembershipRepository,
    private readonly statistics: MailStatisticsRepository,
    private readonly admins: AdminRepository,
    private readonly audit: AuditService,
    private readonly hosts: OrganisationHostCache,
    config: ConfigService<Env, true>,
  ) {
    this.productName = config.get('PRODUCT_NAME', { infer: true });
  }

  /**
   * List every Organisation, the newest first.
   */
  public async list(): Promise<ConsoleOrganisationView[]> {
    const organisations = await this.organisations.list();
    const counts = await this.statistics.listAll();

    return organisations.map((organisation) => ({ organisation, mail: counts.get(organisation.id) ?? NO_MAIL }));
  }

  /**
   * Approve a pending Organisation, which may then publish and keeps its subdomain from now on.
   * @param actor the Platform operator
   * @param id Organisation id
   */
  public async approve(actor: Actor, id: string): Promise<ConsoleOrganisationView> {
    return this.withMail(await this.change(actor, id, 'pending', { status: 'approved' }, 'organisation.approve'));
  }

  /**
   * Suspend an approved Organisation: its subdomain answers that it is suspended, and it sends no mail.
   * @param actor the Platform operator
   * @param id Organisation id
   */
  public async suspend(actor: Actor, id: string): Promise<ConsoleOrganisationView> {
    return this.withMail(await this.change(actor, id, 'approved', { status: 'suspended' }, 'organisation.suspend'));
  }

  /**
   * Change a pending Organisation's subdomain, under the rules of a signup.
   * @param actor the Platform operator
   * @param id Organisation id
   * @param subdomain the new subdomain, lowercase
   * @throws {BadRequestException} when it is malformed or reserved
   * @throws {ConflictException} when another Organisation has it
   */
  public async rename(actor: Actor, id: string, subdomain: string): Promise<ConsoleOrganisationView> {
    const problem = subdomainProblem(subdomain, this.productName);

    if (problem !== null) {
      throw new BadRequestException({ code: problem, message: `Subdomain refused: ${problem}` });
    }

    try {
      return await this.withMail(await this.change(actor, id, 'pending', { subdomain }, 'organisation.update'));
    } catch (error) {
      if (violatedConstraint(error, 'unique') === 'organisations_subdomain_key') {
        const code: SubdomainErrorCode = 'subdomain_taken';

        throw new ConflictException({ code, message: 'Another Organisation has this subdomain' });
      }

      throw error;
    }
  }

  /**
   * Reject a pending Organisation: delete it with everything it holds, so its subdomain is free, and the
   * accounts of its members who belong nowhere else, so their emails are free too.
   * @param actor the Platform operator
   * @param id Organisation id
   */
  public async reject(actor: Actor, id: string): Promise<void> {
    const memberIds = await this.memberships.listAdminIdsByOrganisation(id);
    const removed = await this.organisations.removeWhileStatus(id, 'pending');

    if (removed === null) {
      throw await this.refusal(id, 'pending');
    }

    this.hosts.forgetAfterCommit();
    await this.audit.recordForPlatform(actor, {
      action: 'organisation.remove',
      target: { type: 'organisation', id },
      change: { before: removed, after: null },
    });

    for (const adminId of await this.admins.removeWithoutMembership(memberIds)) {
      await this.audit.recordForPlatform(actor, { action: 'admin.remove', target: { type: 'admin', id: adminId } });
    }
  }

  /**
   * Show an Organisation with its mail counts.
   * @param organisation the Organisation
   */
  private async withMail(organisation: OrganisationEntity): Promise<ConsoleOrganisationView> {
    return { organisation, mail: await this.statistics.getOf(organisation.id) };
  }

  /**
   * Change an Organisation that has the given status, and audit it.
   * @param actor the Platform operator
   * @param id Organisation id
   * @param status the status it must have
   * @param change the new status or subdomain
   * @param action the audit entry's action
   */
  private async change(
    actor: Actor,
    id: string,
    status: OrganisationStatus,
    change: ConsoleChange,
    action: string,
  ): Promise<OrganisationEntity> {
    // Locked, so a simultaneous console action waits and the audit entry's old values are the true ones.
    const before = await this.organisations.getByIdForUpdate(id);
    const after = await this.organisations.updateWhileStatus(id, status, change);

    if (before === null || after === null) {
      throw await this.refusal(id, status);
    }

    this.hosts.forgetAfterCommit();
    await this.audit.recordForPlatform(actor, {
      action,
      target: { type: 'organisation', id },
      change: { before, after },
    });

    return after;
  }

  /**
   * Explain why a change to an Organisation that needs a status was refused.
   * @param id Organisation id
   * @param status the status it needed
   * @throws {Error} for a status no console change starts from
   */
  private async refusal(id: string, status: OrganisationStatus): Promise<NotFoundException | ConflictException> {
    if ((await this.organisations.getById(id)) === null) {
      return new NotFoundException();
    }

    const code = NOT_IN_STATUS[status];

    if (code === null) {
      throw new Error(`No console change starts from ${status}`);
    }

    return new ConflictException({ code, message: `The Organisation is not ${status}` });
  }
}
