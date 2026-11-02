import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

import type { Actor } from '../audit/actor.ts';
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
    case 'account':
      return { kind: 'admin', identity: scope.admin.id, ipAddress };
    case 'guardian':
      return { kind: 'guardian', identity: scope.guardian.email, ipAddress };
    case 'public':
    case 'gateway':
    case 'platform':
    case 'unscoped':
      throw new Error(`A ${scope.access} request has no actor`);
  }
}

// The admin or guardian making the request.
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
