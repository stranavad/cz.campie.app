import type { Request, Response } from 'express';

import type { IssuedSession } from './session-token.ts';

// The __Host- prefix makes browsers refuse the cookie unless it is Secure, has Path=/ and no Domain, so
// it stays on the exact host that set it: the main host for an admin, one Organisation's subdomain for a
// guardian. Behind the same-origin proxy that host is the frontend's.
export const SESSION_COOKIES = {
  admin: '__Host-admin_session',
  guardian: '__Host-guardian_session',
} as const;

export type SessionKind = keyof typeof SESSION_COOKIES;

const COOKIE_OPTIONS = { httpOnly: true, secure: true, sameSite: 'lax', path: '/' } as const;

/**
 * Set the session cookie on a response.
 * @param response the response
 * @param kind whose session it is
 * @param session the issued session
 */
export function writeSessionCookie(response: Response, kind: SessionKind, session: IssuedSession): void {
  response.cookie(SESSION_COOKIES[kind], session.token, { ...COOKIE_OPTIONS, expires: session.expiresAt });
}

/**
 * Tell the browser to drop the session cookie.
 * @param response the response
 * @param kind whose session it was
 */
export function clearSessionCookie(response: Response, kind: SessionKind): void {
  response.clearCookie(SESSION_COOKIES[kind], COOKIE_OPTIONS);
}

/**
 * Read the session token a request's cookie carries.
 * @param request the request
 * @param kind whose session to read
 */
export function readSessionCookie(request: Request, kind: SessionKind): string | null {
  const prefix = `${SESSION_COOKIES[kind]}=`;

  for (const pair of (request.headers.cookie ?? '').split(';')) {
    const trimmed = pair.trim();

    if (trimmed.startsWith(prefix) && trimmed.length > prefix.length) {
      return trimmed.slice(prefix.length);
    }
  }

  return null;
}
