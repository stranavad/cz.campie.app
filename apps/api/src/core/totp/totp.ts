import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

// RFC 6238 with the parameters every authenticator app defaults to: HMAC-SHA1, 6 digits, 30-second steps.
const STEP_SECONDS = 30;
const DIGITS = 6;
const SECRET_BYTES = 20;
// A code of the step before or after is accepted too, for a phone's clock that is a little off.
const DRIFT_STEPS = 1;
const CODE_PATTERN = /^\d{6}$/;
const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

/**
 * Generate a new random TOTP secret.
 */
export function generateTotpSecret(): Buffer {
  return randomBytes(SECRET_BYTES);
}

/**
 * Compute the code an authenticator app shows at an instant.
 * @param secret the shared secret
 * @param now the instant
 */
export function totpCode(secret: Buffer, now: Date): string {
  return codeAt(secret, stepAt(now));
}

/**
 * Find the time step whose code a code is, among the steps around an instant.
 * @param secret the shared secret
 * @param code the code as entered
 * @param now the current instant
 * @returns the matching step, which a caller keeps so the code cannot be used again, or null
 */
export function matchTotpStep(secret: Buffer, code: string, now: Date): number | null {
  if (!CODE_PATTERN.test(code)) {
    return null;
  }

  const current = stepAt(now);
  const entered = Buffer.from(code);

  for (let step = Math.max(0, current - DRIFT_STEPS); step <= current + DRIFT_STEPS; step += 1) {
    if (timingSafeEqual(Buffer.from(codeAt(secret, step)), entered)) {
      return step;
    }
  }

  return null;
}

/**
 * Build the otpauth URI an authenticator app reads, by QR code or by hand.
 * @param secret the shared secret
 * @param label who the code is for and at which issuer, as the app lists it
 */
export function totpUri(secret: Buffer, { issuer, account }: { issuer: string; account: string }): string {
  const query = new URLSearchParams({
    secret: encodeBase32(secret),
    issuer,
    algorithm: 'SHA1',
    digits: String(DIGITS),
    period: String(STEP_SECONDS),
  });

  return `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(account)}?${query.toString()}`;
}

/**
 * Encode bytes in RFC 4648 base32 without padding, the form authenticator apps take a secret in.
 * @param bytes the bytes
 */
export function encodeBase32(bytes: Buffer): string {
  let bits = 0;
  let value = 0;
  let output = '';

  for (const byte of bytes) {
    value = (value << 8) | byte;
    bits += 8;

    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }

  return output;
}

/**
 * Find the time step an instant falls in.
 * @param now the instant
 */
function stepAt(now: Date): number {
  return Math.floor(now.getTime() / 1000 / STEP_SECONDS);
}

/**
 * Compute the code of one time step (RFC 4226 HOTP with the step as the counter).
 * @param secret the shared secret
 * @param step the time step
 */
function codeAt(secret: Buffer, step: number): string {
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(step));

  const digest = createHmac('sha1', secret).update(counter).digest();
  const offset = (digest.at(-1) ?? 0) & 0x0f;
  const binary = digest.readUInt32BE(offset) & 0x7fffffff;

  return String(binary % 10 ** DIGITS).padStart(DIGITS, '0');
}
