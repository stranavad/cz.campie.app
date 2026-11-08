import { ForbiddenException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { z } from 'zod';

import { PERMISSION_AREAS, type Permissions } from '@repo/schema/admins';
import type { AccessErrorCode } from '@repo/schema/shared';

import { MembershipRepository } from '../../repositories/admins/membership/membership.repository.ts';
import { TotpCredentialRepository } from '../../repositories/admins/totp-credential/totp-credential.repository.ts';
import { OperatorRepository } from '../../repositories/operators/operator/operator.repository.ts';
import { OrganisationRepository } from '../../repositories/organisations/organisation/organisation.repository.ts';
import { SupportGrantRepository } from '../../repositories/organisations/support-grant/support-grant.repository.ts';
import type { Env } from '../config/env.schema.ts';
import { UnitOfWork } from '../database/unit-of-work.ts';
import { Clock } from '../ports/clock/clock.port.ts';
import { SessionService } from '../sessions/session.service.ts';
import { parseHost } from './host.ts';
import type { RequestScope } from './request-scope.ts';

const uuid = z.uuid();

/**
 * Keep a value from a header or path only if it is an id, so a malformed one is never queried.
 * @param value the value as received
 */
function idOrNull(value: string | undefined): string | null {
  return uuid.safeParse(value).success && value !== undefined ? value : null;
}

/**
 * Build the not-found of a host or path that names no Organisation.
 */
function organisationUnknown(): NotFoundException {
  const code: AccessErrorCode = 'organisation_unknown';

  return new NotFoundException({ code, message: 'No Organisation is reachable here' });
}

/**
 * Build the refusal of a request whose access resolved but is not admitted.
 * @param code why
 * @param message what for the logs
 */
function refusal(code: AccessErrorCode, message: string): ForbiddenException {
  return new ForbiddenException({ code, message });
}

// Resolves who calls and in which Organisation, each lookup in a short unit of work of its own; the route
// then runs in the unit of work of the resolved Organisation.
@Injectable()
export class AccessService {
  private readonly platformDomain: string;

  constructor(
    private readonly unitOfWork: UnitOfWork,
    private readonly organisations: OrganisationRepository,
    private readonly memberships: MembershipRepository,
    private readonly operators: OperatorRepository,
    private readonly sessions: SessionService,
    private readonly supportGrants: SupportGrantRepository,
    private readonly totpCredentials: TotpCredentialRepository,
    private readonly clock: Clock,
    config: ConfigService<Env, true>,
  ) {
    this.platformDomain = config.get('PLATFORM_DOMAIN', { infer: true });
  }

  /**
   * Resolve a public request to the Organisation of its host.
   * @param host the host the browser called
   */
  public async resolvePublic(host: string): Promise<RequestScope> {
    return { access: 'public', organisationId: await this.organisationOfHost(host) };
  }

  /**
   * Resolve a guardian request: its session must belong to the Organisation of its host.
   * @param host the host the browser called
   * @param token the guardian session token, if the request carries one
   * @throws {UnauthorizedException} when there is no live session of the host's Organisation
   */
  public async resolveGuardian(host: string, token: string | null): Promise<RequestScope> {
    const organisationId = await this.organisationOfHost(host);

    // Looked up in the host's Organisation, so row-level security already hides any other Organisation's
    // session; the comparison keeps the rule when a lookup ever escapes it.
    const session =
      token === null ? null : await this.unitOfWork.run(organisationId, () => this.sessions.getGuardian(token));

    if (session === null || session.organisationId !== organisationId) {
      throw new UnauthorizedException();
    }

    return { access: 'guardian', organisationId, guardian: { sessionId: session.id, email: session.email } };
  }

  /**
   * Resolve an admin request on the main host to the Organisation it names, if the admin is a member.
   * @param host the host the browser called
   * @param token the admin session token, if the request carries one
   * @param organisationId the Organisation the request names, if any
   * @throws {NotFoundException} when the host is not the main host
   * @throws {UnauthorizedException} when there is no live admin session
   * @throws {ForbiddenException} when the named Organisation is missing, malformed or not the admin's
   */
  public async resolveAdmin(
    host: string,
    token: string | null,
    organisationId: string | undefined,
  ): Promise<RequestScope> {
    this.requireMainHost(host);

    return this.unitOfWork.runForPlatform(async () => {
      const session = token === null ? null : await this.sessions.getAdmin(token);

      if (session === null) {
        throw new UnauthorizedException();
      }

      const named = idOrNull(organisationId);
      const membership =
        named === null ? null : await this.memberships.getByOrganisationAndAdmin(named, session.adminId);

      if (membership === null) {
        const support = named === null ? null : await this.supportOf(named, session);

        if (support === null) {
          throw new ForbiddenException();
        }

        return support;
      }

      await this.requireTwoStep(membership.organisationId, session);

      return {
        access: 'admin',
        organisationId: membership.organisationId,
        admin: {
          id: session.adminId,
          member: { membershipId: membership.id, owner: membership.owner, permissions: membership.permissions },
        },
      };
    });
  }

  /**
   * Refuse an admin who turned on two-step login but whose session has not passed a code, and, in an
   * Organisation that requires two-step login, an admin who has not set it up; account routes, where they
   * set it up, stay open to both.
   * @param organisationId the Organisation the request acts in
   * @param session the admin session
   * @throws {ForbiddenException} second_factor_required, or totp_setup_required
   */
  private async requireTwoStep(
    organisationId: string,
    session: { readonly adminId: string; readonly secondFactor: boolean },
  ): Promise<void> {
    if (session.secondFactor) {
      return;
    }

    if (await this.totpCredentials.isEnabled(session.adminId)) {
      throw refusal('second_factor_required', 'The session has not passed a TOTP code');
    }

    if ((await this.organisations.getById(organisationId))?.totpRequired === true) {
      throw refusal('totp_setup_required', 'The Organisation requires two-step login');
    }
  }

  /**
   * Let the Platform operator into an Organisation under its support grant in force: every area at read,
   * or at write when the grant allows changes, never as an Owner. The session must have passed a TOTP code,
   * as for the console.
   * @param organisationId the Organisation the request names
   * @param session the admin session
   * @returns the scope, or null when the admin is not the operator or no grant is in force
   */
  private async supportOf(
    organisationId: string,
    session: { readonly id: string; readonly adminId: string; readonly secondFactor: boolean },
  ): Promise<RequestScope | null> {
    if (!session.secondFactor || !(await this.operators.isOperator(session.adminId))) {
      return null;
    }

    const grant = await this.supportGrants.getActive(organisationId, this.clock.now());

    if (grant === null) {
      return null;
    }

    const level = grant.allowWrites ? 'write' : 'read';

    return {
      access: 'admin',
      organisationId,
      admin: {
        id: session.adminId,
        member: {
          membershipId: null,
          owner: false,
          permissions: Object.fromEntries(PERMISSION_AREAS.map((area) => [area, level])) as Permissions,
          support: {
            allowWrites: grant.allowWrites,
            grantId: grant.id,
            sessionId: session.id,
            entered: await this.supportGrants.hasEntered(grant.id, session.id),
          },
        },
      },
    };
  }

  /**
   * Resolve an admin request on the main host outside any Organisation, to the admin's own account.
   * @param host the host the browser called
   * @param token the admin session token, if the request carries one
   * @throws {UnauthorizedException} when there is no live admin session
   */
  public async resolveAccount(host: string, token: string | null): Promise<RequestScope> {
    this.requireMainHost(host);

    const session = token === null ? null : await this.unitOfWork.runForPlatform(() => this.sessions.getAdmin(token));

    if (session === null) {
      throw new UnauthorizedException();
    }

    return {
      access: 'account',
      admin: { id: session.adminId },
      session: { id: session.id, secondFactor: session.secondFactor },
    };
  }

  /**
   * Resolve a request to the operator console: the session's admin must be the Platform operator now, and
   * the session must have passed a TOTP code.
   * @param host the host the browser called
   * @param token the admin session token, if the request carries one
   */
  public async resolveOperator(host: string, token: string | null): Promise<RequestScope> {
    return { access: 'operator', admin: { id: await this.operatorOf(host, token) } };
  }

  /**
   * Resolve the Platform operator's preview of the public pages of an Organisation awaiting approval, named
   * in the path: the operator as for the console, the unit of work the Organisation's. An approved
   * Organisation's pages are on its subdomain, so only a pending one is previewed here.
   * @param host the host the browser called
   * @param token the admin session token, if the request carries one
   * @param organisationId the Organisation id from the path
   * @throws {NotFoundException} organisation_unknown when the path names no Organisation awaiting approval
   */
  public async resolveOperatorPreview(
    host: string,
    token: string | null,
    organisationId: string | undefined,
  ): Promise<RequestScope> {
    const adminId = await this.operatorOf(host, token);
    const named = idOrNull(organisationId);
    const organisation =
      named === null ? null : await this.unitOfWork.runForPlatform(() => this.organisations.getById(named));

    if (organisation === null || organisation.status !== 'pending') {
      throw organisationUnknown();
    }

    return { access: 'operator-preview', organisationId: organisation.id, admin: { id: adminId } };
  }

  /**
   * Find the Platform operator a request on the main host comes from: an admin session that passed a TOTP
   * code, of an admin with the operator flag now.
   * @param host the host the browser called
   * @param token the admin session token, if the request carries one
   * @throws {NotFoundException} when the host is not the main host
   * @throws {UnauthorizedException} when there is no live admin session
   * @throws {ForbiddenException} when the admin is not the Platform operator, or the session has no TOTP
   * code
   */
  private async operatorOf(host: string, token: string | null): Promise<string> {
    this.requireMainHost(host);

    return this.unitOfWork.runForPlatform(async () => {
      const session = token === null ? null : await this.sessions.getAdmin(token);

      if (session === null) {
        throw new UnauthorizedException();
      }

      if (!(await this.operators.isOperator(session.adminId))) {
        throw refusal('not_operator', 'Only the Platform operator reaches the console');
      }

      if (!session.secondFactor) {
        throw refusal('second_factor_required', 'The console needs a session that passed a TOTP code');
      }

      return session.adminId;
    });
  }

  /**
   * Resolve a request on the main host outside any Organisation.
   * @param host the host the browser called
   */
  public resolvePlatform(host: string): RequestScope {
    this.requireMainHost(host);

    return { access: 'platform' };
  }

  /**
   * Resolve a gateway notification to the Organisation its path names.
   * @param organisationId the Organisation id from the path
   */
  public async resolveGateway(organisationId: string | undefined): Promise<RequestScope> {
    const named = idOrNull(organisationId);
    const organisation =
      named === null ? null : await this.unitOfWork.runForPlatform(() => this.organisations.getById(named));

    if (organisation === null) {
      throw organisationUnknown();
    }

    return { access: 'gateway', organisationId: organisation.id };
  }

  /**
   * Find the Organisation whose subdomain a host is. An Organisation awaiting approval has no public
   * pages yet, so its subdomain is unknown to everyone (its admins preview from the main host); a
   * suspended one's is offline.
   * @param host the host the browser called
   * @throws {NotFoundException} when the host is no approved or suspended Organisation's subdomain
   * @throws {ForbiddenException} when the Organisation is suspended
   */
  private async organisationOfHost(host: string): Promise<string> {
    const parsed = parseHost(host, this.platformDomain);

    const organisation =
      parsed.kind === 'organisation'
        ? await this.unitOfWork.runForPlatform(() => this.organisations.getBySubdomain(parsed.subdomain))
        : null;

    if (organisation === null || organisation.status === 'pending') {
      throw organisationUnknown();
    }

    if (organisation.status === 'suspended') {
      throw refusal('organisation_suspended', 'The Organisation is suspended');
    }

    return organisation.id;
  }

  /**
   * Refuse a host other than the main host.
   * @param host the host the browser called
   * @throws {NotFoundException} when the host is not the main host
   */
  private requireMainHost(host: string): void {
    if (parseHost(host, this.platformDomain).kind !== 'main') {
      throw new NotFoundException();
    }
  }
}
