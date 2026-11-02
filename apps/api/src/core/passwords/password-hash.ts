import { argon2, randomBytes, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const derive = promisify(argon2);

// Argon2id with the OWASP minimum: 19 MiB of memory, two passes, one lane.
const PARAMETERS = { memory: 19_456, passes: 2, parallelism: 1, tagLength: 32 } as const;
const SALT_BYTES = 16;

// The PHC string format, so the parameters travel with each hash and can be raised later.
const FORMAT = /^\$argon2id\$v=19\$m=(\d+),t=(\d+),p=(\d+)\$([A-Za-z0-9+/]+)\$([A-Za-z0-9+/]+)$/;

/**
 * Hash a password for storage, with a new random salt.
 * @param password the password as the admin typed it
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_BYTES);
  const hash = await derive('argon2id', { message: password, nonce: salt, ...PARAMETERS });
  const { memory, passes, parallelism } = PARAMETERS;

  return `$argon2id$v=19$m=${memory},t=${passes},p=${parallelism}$${unpadded(salt)}$${unpadded(hash)}`;
}

// Hashed against when there is no stored hash, so a login takes as long whether or not the account exists.
const NO_HASH_SALT = Buffer.alloc(SALT_BYTES);

/**
 * Tell whether a password is the one a stored hash was made from, in constant time. Without a stored
 * hash (no such account, or one without a password) it spends the time of a hash and says no.
 * @param password the password as typed
 * @param stored the stored hash, or null
 */
export async function verifyPassword(password: string, stored: string | null): Promise<boolean> {
  if (stored === null) {
    await derive('argon2id', { message: password, nonce: NO_HASH_SALT, ...PARAMETERS });

    return false;
  }

  const match = FORMAT.exec(stored);

  if (match === null) {
    return false;
  }

  const [, memory, passes, parallelism, salt = '', expected = ''] = match;
  const expectedHash = Buffer.from(expected, 'base64');

  try {
    const hash = await derive('argon2id', {
      message: password,
      nonce: Buffer.from(salt, 'base64'),
      memory: Number(memory),
      passes: Number(passes),
      parallelism: Number(parallelism),
      tagLength: expectedHash.length,
    });

    return timingSafeEqual(hash, expectedHash);
  } catch {
    // Parameters Argon2 refuses (a tag or salt too short) make a hash no password opens.
    return false;
  }
}

function unpadded(bytes: Buffer): string {
  return bytes.toString('base64').replace(/=+$/, '');
}
