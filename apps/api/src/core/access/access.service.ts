import { ForbiddenException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { z } from 'zod';

import type { AccessErrorCode } from '@repo/schema/shared';

import { MembershipRepository } from '../../repositories/admins/membership/membership.repository.ts';
import { OrganisationRepository } from '../../repositories/organisations/organisation/organisation.repository.ts';
import type { Env } from '../config/env.schema.ts';
import { UnitOfWork } from '../database/unit-of-work.ts';
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

// Resolves who calls and in which Organisation, each lookup in a short unit of work of its own; the route
// then runs in the unit of work of the resolved Organisation.
@Injectable()
export class AccessService {
  private readonly platformDomain: string;

  constructor(
    private readonly unitOfWork: UnitOfWork,
    private readonly organisations: OrganisationRepository,
    private readonly memberships: MembershipRepository,
    private readonly sessions: SessionService,
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
        throw new ForbiddenException();
      }

      return {
        access: 'admin',
        organisationId: membership.organisationId,
        admin: { id: session.adminId, membershipId: membership.id },
      };
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
   * Find the Organisation whose subdomain a host is.
   * @param host the host the browser called
   * @throws {NotFoundException} when the host is no Organisation's subdomain
   */
  private async organisationOfHost(host: string): Promise<string> {
    const parsed = parseHost(host, this.platformDomain);

    const organisation =
      parsed.kind === 'organisation'
        ? await this.unitOfWork.runForPlatform(() => this.organisations.getBySubdomain(parsed.subdomain))
        : null;

    if (organisation === null) {
      throw organisationUnknown();
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
