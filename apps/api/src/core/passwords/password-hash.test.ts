import { describe, expect, it } from 'vitest';

import { hashPassword, verifyPassword } from './password-hash.ts';

describe('password hashes', () => {
  it('verifies the password it was made from, and no other', async () => {
    const hash = await hashPassword('dlouhe-testovaci-heslo');

    expect(hash).toMatch(/^\$argon2id\$v=19\$m=19456,t=2,p=1\$[A-Za-z0-9+/]+\$[A-Za-z0-9+/]+$/);
    expect(await verifyPassword('dlouhe-testovaci-heslo', hash)).toBe(true);
    expect(await verifyPassword('dlouhe-testovaci-hesla', hash)).toBe(false);
  });

  it('salts every hash, so one password never hashes the same twice', async () => {
    expect(await hashPassword('dlouhe-testovaci-heslo')).not.toBe(await hashPassword('dlouhe-testovaci-heslo'));
  });

  it('refuses a hash in any other format', async () => {
    expect(await verifyPassword('heslo', '$2b$10$abcdefghijklmnopqrstuv')).toBe(false);
    expect(await verifyPassword('heslo', '$argon2id$v=19$m=19456,t=2,p=1$AAAA$A')).toBe(false);
  });
});
