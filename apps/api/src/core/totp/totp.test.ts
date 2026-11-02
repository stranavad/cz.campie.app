import { describe, expect, it } from 'vitest';

import { encodeBase32, matchTotpStep, totpUri } from './totp.ts';

// The shared secret of RFC 6238's SHA-1 test vectors.
const RFC_SECRET = Buffer.from('12345678901234567890', 'ascii');

/**
 * Build the instant a number of seconds after the Unix epoch.
 * @param seconds seconds since the epoch
 */
function at(seconds: number): Date {
  return new Date(seconds * 1000);
}

describe('TOTP', () => {
  // RFC 6238, appendix B: the 8-digit SHA-1 codes, of which an authenticator app shows the last 6.
  it.each([
    [59, '287082'],
    [1111111109, '081804'],
    [1111111111, '050471'],
    [1234567890, '005924'],
    [2000000000, '279037'],
    [20000000000, '353130'],
  ])('accepts the RFC code at %i seconds', (seconds, code) => {
    expect(matchTotpStep(RFC_SECRET, code, at(seconds))).toBe(Math.floor(seconds / 30));
  });

  it('accepts the code of the step before and after, for a clock that drifts, and no further', () => {
    // 287082 is the code of step 1 (30 to 59 seconds).
    expect(matchTotpStep(RFC_SECRET, '287082', at(0))).toBe(1);
    expect(matchTotpStep(RFC_SECRET, '287082', at(89))).toBe(1);
    expect(matchTotpStep(RFC_SECRET, '287082', at(90))).toBeNull();
  });

  it('refuses a wrong or malformed code', () => {
    expect(matchTotpStep(RFC_SECRET, '287083', at(59))).toBeNull();
    expect(matchTotpStep(RFC_SECRET, '28708', at(59))).toBeNull();
    expect(matchTotpStep(RFC_SECRET, '2870822', at(59))).toBeNull();
    expect(matchTotpStep(RFC_SECRET, '28708a', at(59))).toBeNull();
  });

  it('encodes the secret in base32 as authenticator apps read it', () => {
    expect(encodeBase32(RFC_SECRET)).toBe('GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ');
    expect(encodeBase32(Buffer.from('f'))).toBe('MY');
    expect(encodeBase32(Buffer.from('fooba'))).toBe('MZXW6YTB');
  });

  it('names the issuer and account in the otpauth URI', () => {
    expect(totpUri(RFC_SECRET, { issuer: 'Campie', account: 'operator@example.com' })).toBe(
      'otpauth://totp/Campie:operator%40example.com?secret=GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ&issuer=Campie&algorithm=SHA1&digits=6&period=30',
    );
  });
});
