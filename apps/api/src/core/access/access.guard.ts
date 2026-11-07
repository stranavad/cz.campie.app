import { ForbiddenException, Injectable, type CanActivate, type ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';

import { ACCESS_HEADERS, type AccessErrorCode } from '@repo/schema/shared';

import { readSessionCookie } from '../sessions/session-cookie.ts';
import { Access, GATEWAY_ORGANISATION_PARAM, type AccessKind } from './access.decorator.ts';
import { AccessService } from './access.service.ts';
import { originalHost } from './host.ts';
import { allows, RequirePermission, SupportEntry, type MemberAccess } from './permission.ts';
import { setRequestScope, type RequestScope } from './request-scope.ts';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

// Runs before every route: refuses forged cross-site mutations, then resolves the request's access as its
// controller declares it, for the unit of work and the actor.
@Injectable()
export class AccessGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly access: AccessService,
  ) {}

  public async canActivate(context: ExecutionContext): Promise<boolean> {
    const controller = context.getClass();
    const kind = this.reflector.get(Access, controller);

    if (kind === undefined) {
      throw new Error(`${controller.name} declares no access`);
    }

    const request = context.switchToHttp().getRequest<Request>();

    // A gateway or a webhook calls server to server, without cookies, so there is nothing to forge.
    if (
      kind !== 'gateway' &&
      kind !== 'webhook' &&
      !SAFE_METHODS.has(request.method) &&
      request.get(ACCESS_HEADERS.csrf) === undefined
    ) {
      const code: AccessErrorCode = 'csrf_header_missing';

      throw new ForbiddenException({ code, message: 'A mutating request must carry the CSRF header' });
    }

    const scope = await this.resolve(kind, request);

    if (scope.access === 'admin') {
      this.requirePermission(context, scope.admin.member);
      this.requireSupportWrites(context, request, scope.admin.member);
    }

    setRequestScope(request, scope);

    return true;
  }

  /**
   * Refuse an admin request whose membership lacks what its route requires.
   * @param context the route being called
   * @param member the membership the request acts through
   * @throws {ForbiddenException} when the membership does not meet the requirement
   */
  private requirePermission(context: ExecutionContext, member: MemberAccess): void {
    const requirement = this.reflector.getAllAndOverride(RequirePermission, [context.getHandler(), context.getClass()]);

    if (requirement === undefined) {
      throw new Error(`${context.getClass().name}.${context.getHandler().name} declares no permission`);
    }

    if (!allows(member, requirement)) {
      const code: AccessErrorCode = 'permission_denied';

      throw new ForbiddenException({ code, message: 'The membership lacks the permission this route requires' });
    }
  }

  /**
   * Refuse a change by the Platform operator under a read-only support grant, but for entering itself.
   * @param context the route being called
   * @param request the request
   * @param member the membership the request acts through
   * @throws {ForbiddenException} support_read_only
   */
  private requireSupportWrites(context: ExecutionContext, request: Request, member: MemberAccess): void {
    const readOnly = member.support !== undefined && !member.support.allowWrites;

    if (
      readOnly &&
      !SAFE_METHODS.has(request.method) &&
      this.reflector.get(SupportEntry, context.getHandler()) !== true
    ) {
      const code: AccessErrorCode = 'support_read_only';

      throw new ForbiddenException({ code, message: 'The support grant allows no changes' });
    }
  }

  private resolve(kind: AccessKind, request: Request): RequestScope | Promise<RequestScope> {
    switch (kind) {
      case 'public':
        return this.access.resolvePublic(originalHost(request));
      case 'guardian':
        return this.access.resolveGuardian(originalHost(request), readSessionCookie(request, 'guardian'));
      case 'admin':
        return this.access.resolveAdmin(
          originalHost(request),
          readSessionCookie(request, 'admin'),
          request.get(ACCESS_HEADERS.organisation),
        );
      case 'account':
        return this.access.resolveAccount(originalHost(request), readSessionCookie(request, 'admin'));
      case 'operator':
        return this.access.resolveOperator(originalHost(request), readSessionCookie(request, 'admin'));
      case 'platform':
        return this.access.resolvePlatform(originalHost(request));
      case 'gateway':
        const organisationId = request.params[GATEWAY_ORGANISATION_PARAM];

        return this.access.resolveGateway(typeof organisationId === 'string' ? organisationId : undefined);
      case 'webhook':
        return { access: 'webhook' };
      case 'unscoped':
        return { access: 'unscoped' };
    }
  }
}
