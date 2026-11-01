import { createHmac, createSecretKey, hkdfSync, timingSafeEqual, type KeyObject } from 'node:crypto';
import { z } from 'zod';

// What a download link grants: one file of one Organisation, until it expires.
export interface DownloadGrant {
  readonly organisationId: string;
  readonly fileId: string;
  readonly expiresAt: Date;
}

const LINK_KEY_INFO = Buffer.from('campie download link');
const SEPARATOR = '.';

const grantParts = z.tuple([z.uuid(), z.uuid(), z.coerce.number().int().positive()]);

/**
 * Derive the key that signs download links from the master key, so links need no stored secret of their own.
 * @param masterKey the platform master key
 */
export function downloadLinkKey(masterKey: KeyObject): KeyObject {
  return createSecretKey(Buffer.from(hkdfSync('sha256', masterKey, Buffer.alloc(0), LINK_KEY_INFO, 32)));
}

/**
 * Sign a grant into a token for a URL path: Organisation, file and expiry in seconds, then their HMAC.
 * @param key the download link key
 * @param grant what the link grants
 */
export function signDownloadToken(key: KeyObject, grant: DownloadGrant): string {
  const payload = [grant.organisationId, grant.fileId, Math.floor(grant.expiresAt.getTime() / 1000)].join(SEPARATOR);

  return `${payload}${SEPARATOR}${mac(key, payload).toString('base64url')}`;
}

/**
 * Read the grant of a token this platform signed. Expiry is the caller's to check.
 * @param key the download link key
 * @param token the token from a link
 * @returns null when the token is malformed or not signed with the key
 */
export function readDownloadToken(key: KeyObject, token: string): DownloadGrant | null {
  const cut = token.lastIndexOf(SEPARATOR);
  const payload = token.slice(0, cut);
  const signature = Buffer.from(token.slice(cut + 1), 'base64url');
  const expected = mac(key, payload);

  if (cut < 0 || signature.length !== expected.length || !timingSafeEqual(signature, expected)) {
    return null;
  }

  const parts = grantParts.safeParse(payload.split(SEPARATOR));

  if (!parts.success) {
    return null;
  }

  const [organisationId, fileId, expiresAtSeconds] = parts.data;

  return { organisationId, fileId, expiresAt: new Date(expiresAtSeconds * 1000) };
}

/**
 * Compute the HMAC-SHA256 of a token's payload.
 * @param key the download link key
 * @param payload the token without its signature
 */
function mac(key: KeyObject, payload: string): Buffer {
  return createHmac('sha256', key).update(payload).digest();
}
