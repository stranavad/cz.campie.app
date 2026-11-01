import { createHash, randomBytes } from 'node:crypto';

// A session as handed to the browser: the token goes into the cookie, and only its hash is stored, so the
// sessions table alone opens no session.
export interface IssuedSession {
  readonly token: string;
  readonly expiresAt: Date;
}

/**
 * Generate a new session token: 256 random bits, URL-safe, so a cookie carries it unencoded.
 */
export function generateSessionToken(): string {
  return randomBytes(32).toString('base64url');
}

/**
 * Hash a session token for storage and lookup.
 * @param token the token from the cookie
 */
export function hashSessionToken(token: string): Buffer {
  return createHash('sha256').update(token).digest();
}
