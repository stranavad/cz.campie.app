import { expect } from 'vitest';

import type { TotpEnrolment } from '@repo/schema/admins';

import { SESSION_COOKIES } from '../core/sessions/session-cookie.ts';
import { totpCode } from '../core/totp/totp.ts';
import type { RequestHeaders } from './fixtures.ts';
import type { useTestApp } from './test-app.ts';

type Http = ReturnType<ReturnType<typeof useTestApp>['http']>;

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

/**
 * Decode the base32 secret an enrolment shows, as an authenticator app reads it.
 * @param text the secret in RFC 4648 base32, without padding
 */
export function decodeBase32(text: string): Buffer {
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];

  for (const character of text) {
    value = (value << 5) | BASE32_ALPHABET.indexOf(character);
    bits += 5;

    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }

  return Buffer.from(bytes);
}

/**
 * Take the headers of a request on, with the session cookie a response set in place of the old one.
 * @param headers the headers sent so far
 * @param response the response that replaced the session
 */
export function withSessionFrom(
  headers: RequestHeaders,
  response: { headers: Record<string, unknown> },
): RequestHeaders {
  const cookie = [response.headers['set-cookie'] ?? []]
    .flat()
    .map(String)
    .find((value) => value.startsWith(`${SESSION_COOKIES.admin}=`));

  if (cookie === undefined) {
    throw new Error('The response set no admin session cookie');
  }

  return { ...headers, Cookie: cookie.split(';')[0] ?? '' };
}

/**
 * Set up TOTP for the Platform operator over HTTP, as their authenticator app would.
 * @param http the test app's client
 * @param headers the operator's main host headers
 * @param now the test clock's instant
 * @returns the secret, for codes at later logins, and the headers of the session that passed it
 */
export async function enrolOperatorTotp(
  http: Http,
  headers: RequestHeaders,
  now: Date,
): Promise<{ secret: Buffer; headers: RequestHeaders }> {
  const started = await http.post('/api/account/totp').set(headers);
  expect(started.status).toBe(201);
  const secret = decodeBase32((started.body as TotpEnrolment).secret);

  const confirmed = await http
    .post('/api/account/totp/confirm')
    .set(headers)
    .send({ code: totpCode(secret, now) });
  expect(confirmed.status).toBe(204);

  return { secret, headers: withSessionFrom(headers, confirmed) };
}
