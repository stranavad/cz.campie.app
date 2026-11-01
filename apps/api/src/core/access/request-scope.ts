import type { Request } from 'express';

// What the access guard resolved for a request: the Organisation its unit of work runs in, and who acts.
export type RequestScope =
  | { readonly access: 'public' | 'gateway'; readonly organisationId: string }
  | {
      readonly access: 'guardian';
      readonly organisationId: string;
      readonly guardian: { readonly sessionId: string; readonly email: string };
    }
  | {
      readonly access: 'admin';
      readonly organisationId: string;
      readonly admin: { readonly id: string; readonly membershipId: string };
    }
  | { readonly access: 'platform' | 'unscoped' };

const scopes = new WeakMap<Request, RequestScope>();

/**
 * Keep the resolved scope with its request.
 * @param request the request
 * @param scope what the access guard resolved
 */
export function setRequestScope(request: Request, scope: RequestScope): void {
  scopes.set(request, scope);
}

/**
 * Read the scope the access guard resolved for a request.
 * @param request the request
 * @throws {Error} when the guard has not resolved it, which no route can reach
 */
export function requestScope(request: Request): RequestScope {
  const scope = scopes.get(request);

  if (scope === undefined) {
    throw new Error('The request has no resolved scope; the access guard did not run');
  }

  return scope;
}
