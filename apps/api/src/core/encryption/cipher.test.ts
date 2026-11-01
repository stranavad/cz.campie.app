import { createHash, createSecretKey, randomBytes } from 'node:crypto';
import { Readable, Writable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { describe, expect, it } from 'vitest';

import { OrganisationCipher } from './cipher.ts';

const MIB = 1024 * 1024;

// Version 1 file layout: a 17-byte header, then segments of 64 KiB plaintext, each with a 16-byte tag.
const HEADER_BYTES = 17;
const SEGMENT_BYTES = 64 * 1024 + 16;

const newCipher = () => new OrganisationCipher(createSecretKey(randomBytes(32)));

/**
 * Collect a stream's bytes into one buffer.
 * @param stream the stream to read to its end
 */
async function collect(stream: Readable): Promise<Buffer> {
  const chunks: Buffer[] = [];

  for await (const chunk of stream) {
    chunks.push(Buffer.from(chunk));
  }

  return Buffer.concat(chunks);
}

describe('organisation cipher', () => {
  it('streams a 10 MB file through encryption and back byte for byte, without holding it whole', async () => {
    const cipher = newCipher();
    const input = createHash('sha256');
    const output = createHash('sha256');
    let produced = 0;
    let producedAtFirstOutput: number | undefined;

    const source = Readable.from(
      (function* () {
        for (let i = 0; i < 160; i++) {
          const chunk = randomBytes(MIB / 16);
          input.update(chunk);
          produced += chunk.length;
          yield chunk;
        }
      })(),
    );
    const sink = new Writable({
      write(chunk: Buffer, _encoding, done) {
        producedAtFirstOutput ??= produced;
        output.update(chunk);
        done();
      },
    });

    await pipeline(source, cipher.encryptStream(), cipher.decryptStream(), sink);

    expect(produced).toBe(10 * MIB);
    expect(output.digest('hex')).toBe(input.digest('hex'));
    expect(producedAtFirstOutput).toBeLessThan(MIB);
  });

  it('refuses a file cut at a segment boundary', async () => {
    const cipher = newCipher();
    const ciphertext = await collect(Readable.from([randomBytes(200 * 1024)]).pipe(cipher.encryptStream()));
    const cut = ciphertext.subarray(0, HEADER_BYTES + 2 * SEGMENT_BYTES);

    await expect(collect(Readable.from([cut]).pipe(cipher.decryptStream()))).rejects.toThrow(
      'A file failed to decrypt: wrong key, or altered or truncated ciphertext',
    );
  });

  it('refuses a value of an unknown scheme version', () => {
    const cipher = newCipher();
    const encrypted = cipher.encrypt('test value');
    encrypted[0] = 2;

    expect(() => cipher.decrypt(encrypted)).toThrow('Unknown encryption version 2');
  });
});
