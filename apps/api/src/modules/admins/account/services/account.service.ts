import { Injectable } from '@nestjs/common';
import { asc, eq, inArray } from 'drizzle-orm';

import { PERMISSION_AREAS, type Account } from '@repo/schema/admins';

import { UnitOfWork } from '../../../../core/database/unit-of-work.ts';
import { Clock } from '../../../../core/ports/clock/clock.port.ts';
import { memberships, organisations } from '../../../../db/schema.ts';
import { permissionsOf } from '../../../../repositories/admins/membership/membership.entity.ts';
import { OperatorRepository } from '../../../../repositories/operators/operator/operator.repository.ts';
import { SupportGrantRepository } from '../../../../repositories/organisations/support-grant/support-grant.repository.ts';
import { AdminService } from '../../admin/services/admin.service.ts';
import { TotpService } from '../../totp/services/totp.service.ts';

@Injectable()
export class AccountService {
  constructor(
    private readonly admins: AdminService,
    private readonly totp: TotpService,
    private readonly operators: OperatorRepository,
    private readonly unitOfWork: UnitOfWork,
    private readonly supportGrants: SupportGrantRepository,
    private readonly clock: Clock,
  ) {}

  /**
   * Get an admin's own account: their email, whether they are the Platform operator, their TOTP and this
   * session's, and the Organisations they are a member of, with each one's status and their permissions. Reads platform tables
   * only, so it runs in a platform unit of work.
   * @param adminId the signed-in admin
   * @param session their session
   */
  public async get(adminId: string, session: { readonly secondFactor: boolean }): Promise<Account> {
    const admin = await this.admins.getByIdOrThrow(adminId);

    const rows = await this.unitOfWork.db
      .select({
        membership: memberships,
        organisation: {
          id: organisations.id,
          displayName: organisations.displayName,
          subdomain: organisations.subdomain,
          status: organisations.status,
        },
      })
      .from(memberships)
      .innerJoin(organisations, eq(organisations.id, memberships.organisationId))
      .where(eq(memberships.adminId, adminId))
      .orderBy(asc(memberships.id));

    const operator = await this.operators.isOperator(adminId);

    return {
      email: admin.email,
      operator,
      totpEnabled: await this.totp.isEnabled(adminId),
      secondFactor: session.secondFactor,
      memberships: [
        ...rows.map(({ membership, organisation }) => ({
          owner: membership.owner,
          permissions: permissionsOf(membership),
          organisation,
          support: null,
        })),
        // The access guard lets the operator in only with a TOTP code, so the account offers them only then.
        ...(operator && session.secondFactor ? await this.supported() : []),
      ],
    };
  }

  /**
   * List the Organisations with a support grant in force, as the operator enters them.
   */
  private async supported(): Promise<Account['memberships']> {
    const grants = await this.supportGrants.listActive(this.clock.now());
    const organisationsById = new Map(
      (grants.length === 0
        ? []
        : await this.unitOfWork.db
            .select({
              id: organisations.id,
              displayName: organisations.displayName,
              subdomain: organisations.subdomain,
              status: organisations.status,
            })
            .from(organisations)
            .where(
              inArray(
                organisations.id,
                grants.map(({ organisationId }) => organisationId),
              ),
            )
      ).map((organisation) => [organisation.id, organisation]),
    );

    return grants.flatMap((grant) => {
      const organisation = organisationsById.get(grant.organisationId);
      const level = grant.allowWrites ? 'write' : 'read';

      return organisation === undefined
        ? []
        : [
            {
              owner: false,
              permissions: Object.fromEntries(
                PERMISSION_AREAS.map((area) => [area, level]),
              ) as Account['memberships'][number]['permissions'],
              organisation,
              support: { allowWrites: grant.allowWrites, expiresAt: grant.expiresAt.toISOString() },
            },
          ];
    });
  }
}
