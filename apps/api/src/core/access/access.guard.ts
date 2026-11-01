import { ForbiddenException, Injectable, type CanActivate, type ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';

import { ACCESS_HEADERS, type AccessErrorCode } from '@repo/schema/shared';

import { readSessionCookie } from '../sessions/session-cookie.ts';
import { Access, GATEWAY_ORGANISATION_PARAM, type AccessKind } from './access.decorator.ts';
import { AccessService } from './access.service.ts';
import { originalHost } from './host.ts';
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

    // A gateway calls server to server, without cookies, so there is nothing to forge.
    if (kind !== 'gateway' && !SAFE_METHODS.has(request.method) && request.get(ACCESS_HEADERS.csrf) === undefined) {
      const code: AccessErrorCode = 'csrf_header_missing';

      throw new ForbiddenException({ code, message: 'A mutating request must carry the CSRF header' });
    }

    setRequestScope(request, await this.resolve(kind, request));

    return true;
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
      case 'platform':
        return this.access.resolvePlatform(originalHost(request));
      case 'gateway':
        const organisationId = request.params[GATEWAY_ORGANISATION_PARAM];

        return this.access.resolveGateway(typeof organisationId === 'string' ? organisationId : undefined);
      case 'unscoped':
        return { access: 'unscoped' };
    }
  }
}
