import {
  createCipheriv,
  createDecipheriv,
  createHmac,
  createSecretKey,
  hkdfSync,
  randomBytes,
  type KeyObject,
} from 'node:crypto';
import { Transform, type TransformCallback } from 'node:stream';

// Every sealed value starts with the version of the scheme that sealed it, so the scheme can change
// while older values stay readable.
const VERSION = 1;
const ALGORITHM = 'aes-256-gcm';
const IV_BYTES = 12;
const TAG_BYTES = 16;
const KEY_BYTES = 32;
const NO_CONTEXT = Buffer.alloc(0);

// Files are sealed in segments, each authenticated on its own, so a download streams only plaintext that
// is already verified and holds one segment in memory. Each file gets its own key, derived from the data
// key and a random salt, so segment nonces can be a plain counter.
const SALT_BYTES = 16;
const HEADER_BYTES = 1 + SALT_BYTES;
const SEGMENT_BYTES = 64 * 1024;
const SEALED_SEGMENT_BYTES = SEGMENT_BYTES + TAG_BYTES;
const MAX_SEGMENTS = 2 ** 32;
const FILE_KEY_INFO = Buffer.from('campie file key');
const DIGEST_KEY_INFO = Buffer.from('campie platform digest');
const FILE_ERROR = 'A file failed to decrypt: wrong key, or altered or truncated ciphertext';

declare const encrypted: unique symbol;

// A value as stored in an encrypted column: only an OrganisationCipher makes or reads one, so plaintext
// cannot be written there by mistake. Never filtered or sorted in the database.
export type Encrypted = Buffer & { readonly [encrypted]: true };

/**
 * Seal bytes with AES-256-GCM under a random IV: version, IV, ciphertext, tag.
 * @param key a 256-bit key
 * @param plaintext the bytes to seal
 * @param context bound to the result, which opens only with the same context
 */
function seal(key: KeyObject, plaintext: Buffer, context: Buffer): Buffer {
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGORITHM, key, iv, { authTagLength: TAG_BYTES }).setAAD(context);

  return Buffer.concat([Buffer.of(VERSION), iv, cipher.update(plaintext), cipher.final(), cipher.getAuthTag()]);
}

/**
 * Open bytes sealed by seal.
 * @param key the key they were sealed with
 * @param sealed version, IV, ciphertext, tag
 * @param context the context they were sealed with
 * @param subject names the value in the error
 * @throws {Error} on an unknown version, a wrong key or context, or altered bytes
 */
function open(key: KeyObject, sealed: Buffer, context: Buffer, subject: string): Buffer {
  checkVersion(sealed);

  if (sealed.length < 1 + IV_BYTES + TAG_BYTES) {
    throw new Error(`${subject} failed to decrypt: it is truncated`);
  }

  const decipher = createDecipheriv(ALGORITHM, key, sealed.subarray(1, 1 + IV_BYTES), { authTagLength: TAG_BYTES })
    .setAAD(context)
    .setAuthTag(sealed.subarray(-TAG_BYTES));

  try {
    return Buffer.concat([decipher.update(sealed.subarray(1 + IV_BYTES, -TAG_BYTES)), decipher.final()]);
  } catch {
    throw new Error(`${subject} failed to decrypt: wrong key, or altered ciphertext`);
  }
}

/**
 * Check that bytes were sealed by the scheme version this code reads.
 * @param sealed bytes starting with their version
 * @throws {Error} on any other version
 */
function checkVersion(sealed: Buffer): void {
  if (sealed[0] !== VERSION) {
    throw new Error(`Unknown encryption version ${sealed[0] ?? 'none'}`);
  }
}

/**
 * Derive a file's own key from the data key and the file's salt.
 * @param dataKey the Organisation's data key
 * @param salt the file's random salt, from its header
 */
function fileKey(dataKey: KeyObject, salt: Buffer): KeyObject {
  return createSecretKey(Buffer.from(hkdfSync('sha256', dataKey, salt, FILE_KEY_INFO, KEY_BYTES)));
}

/**
 * Build the nonce of a file segment from its index, and whether it is the last one, so segments cannot be
 * reordered, dropped or cut off at a boundary unnoticed.
 * @param index the segment's position in the file
 * @param last whether the file ends with this segment
 * @throws {Error} past the most segments a file can have
 */
function segmentNonce(index: number, last: boolean): Buffer {
  if (index >= MAX_SEGMENTS) {
    throw new Error('A file has too many segments to encrypt');
  }

  const nonce = Buffer.alloc(IV_BYTES);
  nonce.writeUInt32BE(index, IV_BYTES - 5);
  nonce[IV_BYTES - 1] = last ? 1 : 0;

  return nonce;
}

/**
 * Seal one file segment: ciphertext, then tag.
 * @param key the file's key
 * @param index the segment's position
 * @param last whether the file ends here
 * @param plaintext up to one segment of bytes
 */
function sealSegment(key: KeyObject, index: number, last: boolean, plaintext: Buffer): Buffer {
  const cipher = createCipheriv(ALGORITHM, key, segmentNonce(index, last), { authTagLength: TAG_BYTES });

  return Buffer.concat([cipher.update(plaintext), cipher.final(), cipher.getAuthTag()]);
}

/**
 * Open one file segment sealed by sealSegment.
 * @param key the file's key
 * @param index the segment's position
 * @param last whether the file ends here
 * @param sealed ciphertext, then tag
 * @throws {Error} on a wrong key, altered bytes, or a segment out of place
 */
function openSegment(key: KeyObject, index: number, last: boolean, sealed: Buffer): Buffer {
  if (sealed.length < TAG_BYTES) {
    throw new Error(FILE_ERROR);
  }

  const decipher = createDecipheriv(ALGORITHM, key, segmentNonce(index, last), {
    authTagLength: TAG_BYTES,
  }).setAuthTag(sealed.subarray(-TAG_BYTES));

  try {
    return Buffer.concat([decipher.update(sealed.subarray(0, -TAG_BYTES)), decipher.final()]);
  } catch {
    throw new Error(FILE_ERROR);
  }
}

/**
 * Run a step of a stream transform, handing any error to the stream instead of throwing.
 * @param done the transform's callback
 * @param step the work
 */
function guarded(done: TransformCallback, step: () => void): void {
  try {
    step();
    done();
  } catch (error) {
    done(error instanceof Error ? error : new Error(String(error)));
  }
}

/**
 * Generate a new Organisation data key, wrapped by the master key and bound to the Organisation, so a
 * wrapped key moved to another Organisation does not unwrap.
 * @param masterKey the platform master key
 * @param organisationId the Organisation the key belongs to
 */
export function generateWrappedDataKey(masterKey: KeyObject, organisationId: string): Buffer {
  return seal(masterKey, randomBytes(KEY_BYTES), Buffer.from(organisationId));
}

/**
 * Unwrap an Organisation's data key.
 * @param masterKey the platform master key
 * @param wrappedKey the key as stored
 * @param organisationId the Organisation the key belongs to
 */
export function unwrapDataKey(masterKey: KeyObject, wrappedKey: Buffer, organisationId: string): KeyObject {
  return createSecretKey(open(masterKey, wrappedKey, Buffer.from(organisationId), 'The data key'));
}

/**
 * Seal a secret of the platform's own, which belongs to no Organisation, with the master key.
 * @param masterKey the platform master key
 * @param plaintext the secret
 * @param context what the secret belongs to, such as `totp:<admin id>`; never a bare Organisation id, which
 * binds a data key
 */
export function sealPlatformSecret(masterKey: KeyObject, plaintext: Buffer, context: string): Buffer {
  return seal(masterKey, plaintext, Buffer.from(context));
}

/**
 * Open a secret sealed by sealPlatformSecret.
 * @param masterKey the platform master key
 * @param sealed the secret as stored
 * @param context what it was sealed for
 */
export function openPlatformSecret(masterKey: KeyObject, sealed: Buffer, context: string): Buffer {
  return open(masterKey, sealed, Buffer.from(context), 'A platform secret');
}

// Encrypts and decrypts with one Organisation's data key, held in memory only.
export class OrganisationCipher {
  constructor(private readonly dataKey: KeyObject) {}

  /**
   * Encrypt a value for an encrypted column.
   * @param plaintext the value
   */
  public encrypt(plaintext: string): Encrypted {
    return seal(this.dataKey, Buffer.from(plaintext, 'utf8'), NO_CONTEXT) as Encrypted;
  }

  /**
   * Decrypt a value read from an encrypted column.
   * @param value the stored value
   */
  public decrypt(value: Encrypted): string {
    return open(this.dataKey, value, NO_CONTEXT, 'A value').toString('utf8');
  }

  /**
   * Create a stream that encrypts a file's bytes on their way to storage. The ciphertext is longer than the
   * file by the header and one tag per segment.
   */
  public encryptStream(): Transform {
    const salt = randomBytes(SALT_BYTES);
    const key = fileKey(this.dataKey, salt);
    let pending = Buffer.alloc(0);
    let index = 0;

    return new Transform({
      construct(done) {
        this.push(Buffer.concat([Buffer.of(VERSION), salt]));
        done();
      },
      transform(chunk: Buffer, _encoding, done) {
        guarded(done, () => {
          pending = Buffer.concat([pending, chunk]);

          // A full segment is sealed only once more bytes follow it: the last one is sealed as last.
          while (pending.length > SEGMENT_BYTES) {
            this.push(sealSegment(key, index, false, pending.subarray(0, SEGMENT_BYTES)));
            pending = pending.subarray(SEGMENT_BYTES);
            index++;
          }
        });
      },
      flush(done) {
        guarded(done, () => {
          this.push(sealSegment(key, index, true, pending));
        });
      },
    });
  }

  /**
   * Create a stream that decrypts a file's bytes on their way from storage, emitting only verified plaintext.
   * It errors on a wrong key or altered, reordered or truncated ciphertext.
   */
  public decryptStream(): Transform {
    const dataKey = this.dataKey;
    let key: KeyObject | undefined;
    let pending = Buffer.alloc(0);
    let index = 0;

    return new Transform({
      transform(chunk: Buffer, _encoding, done) {
        guarded(done, () => {
          pending = Buffer.concat([pending, chunk]);

          if (key === undefined) {
            if (pending.length < HEADER_BYTES) {
              return;
            }

            checkVersion(pending);
            key = fileKey(dataKey, pending.subarray(1, HEADER_BYTES));
            pending = pending.subarray(HEADER_BYTES);
          }

          while (pending.length > SEALED_SEGMENT_BYTES) {
            this.push(openSegment(key, index, false, pending.subarray(0, SEALED_SEGMENT_BYTES)));
            pending = pending.subarray(SEALED_SEGMENT_BYTES);
            index++;
          }
        });
      },
      flush(done) {
        guarded(done, () => {
          if (key === undefined) {
            throw new Error(FILE_ERROR);
          }

          this.push(openSegment(key, index, true, pending));
        });
      },
    });
  }
}

/**
 * Digest a short platform secret, such as a recovery code, with a key derived from the master key, so a copy
 * of the database alone cannot test guesses against it.
 * @param masterKey the platform master key
 * @param context what the value belongs to, such as `recovery:<admin id>`
 * @param value the value
 * @returns the HMAC-SHA256, hex
 */
export function platformDigest(masterKey: KeyObject, context: string, value: string): string {
  const key = createSecretKey(Buffer.from(hkdfSync('sha256', masterKey, NO_CONTEXT, DIGEST_KEY_INFO, KEY_BYTES)));

  return createHmac('sha256', key).update(context).update('\0').update(value).digest('hex');
}
