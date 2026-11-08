import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

import type { Actor } from '../audit/actor.ts';
import type { MemberAccess } from './permission.ts';
import { requestScope } from './request-scope.ts';

/**
 * Build the actor of a request from its resolved session, for permission checks and audit entries.
 * @param request the request
 * @throws {Error} on a request without a session, or without a peer address
 */
function actorOf(request: Request): Actor {
  const scope = requestScope(request);
  const ipAddress = request.ip;

  if (ipAddress === undefined) {
    throw new Error('The request has no peer address');
  }

  switch (scope.access) {
    case 'admin':
      // The Platform operator under a support grant acts as the operator, in the Organisation's own log.
      return {
        kind: scope.admin.member.support === undefined ? 'admin' : 'operator',
        identity: scope.admin.id,
        ipAddress,
      };
    case 'account':
      return { kind: 'admin', identity: scope.admin.id, ipAddress };
    case 'operator':
    case 'operator-preview':
      return { kind: 'operator', identity: scope.admin.id, ipAddress };
    case 'guardian':
      return { kind: 'guardian', identity: scope.guardian.email, ipAddress };
    case 'public':
    case 'gateway':
    case 'platform':
    case 'webhook':
    case 'unscoped':
      throw new Error(`A ${scope.access} request has no actor`);
  }
}

// The admin, Platform operator or guardian making the request.
export const RequestActor = createParamDecorator((_: unknown, context: ExecutionContext) =>
  actorOf(context.switchToHttp().getRequest<Request>()),
);

// The id of the admin whose session an admin or account request carries.
export const RequestAdminId = createParamDecorator((_: unknown, context: ExecutionContext): string => {
  const scope = requestScope(context.switchToHttp().getRequest<Request>());

  if (scope.access !== 'admin' && scope.access !== 'account') {
    throw new Error(`A ${scope.access} request has no admin`);
  }

  return scope.admin.id;
});

// The email of the guardian a guardian request is signed in as.
export const RequestGuardianEmail = createParamDecorator((_: unknown, context: ExecutionContext): string => {
  const scope = requestScope(context.switchToHttp().getRequest<Request>());

  if (scope.access !== 'guardian') {
    throw new Error(`A ${scope.access} request has no guardian`);
  }

  return scope.guardian.email;
});

// The membership an admin request acts through, for what a route shows by permission, such as health data
// only with Health read.
export const RequestMember = createParamDecorator((_: unknown, context: ExecutionContext): MemberAccess => {
  const scope = requestScope(context.switchToHttp().getRequest<Request>());

  if (scope.access !== 'admin') {
    throw new Error(`A ${scope.access} request has no membership`);
  }

  return scope.admin.member;
});

// The admin session an account request carries, for what happens to the session itself, such as passing
// a TOTP code.
export const RequestAdminSession = createParamDecorator(
  (_: unknown, context: ExecutionContext): { readonly id: string; readonly secondFactor: boolean } => {
    const scope = requestScope(context.switchToHttp().getRequest<Request>());

    if (scope.access !== 'account') {
      throw new Error(`A ${scope.access} request has no account session`);
    }

    return scope.session;
  },
);
