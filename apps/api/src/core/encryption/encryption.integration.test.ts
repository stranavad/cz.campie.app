import { describe, expect, it } from 'vitest';

import { createOrganisation } from '../../testing/fixtures.ts';
import { withClient } from '../../testing/services/postgres.ts';
import { createNotesTable, notes } from '../../testing/tenant-table.ts';
import { useTestApp } from '../../testing/test-app.ts';
import { UnitOfWork } from '../database/unit-of-work.ts';
import { KeyProvider } from '../ports/key-provider/key-provider.port.ts';
import { unwrapDataKey } from './cipher.ts';
import { EncryptionService } from './encryption.service.ts';

// Obviously fake: no real person has this rodné číslo.
const RODNE_CISLO = '000101/0000';

describe('encryption', () => {
  const { app, database } = useTestApp();

  // Encrypt or decrypt in a unit of work of the Organisation, as a service would.
  const withCipher = <T>(
    organisationId: string,
    work: (cipher: Awaited<ReturnType<EncryptionService['cipher']>>) => T,
  ) => {
    const encryption = app().get(EncryptionService);

    return app()
      .get(UnitOfWork)
      .run(organisationId, async () => work(await encryption.cipher()));
  };

  it('creates a wrapped data key with every Organisation and never stores the key itself', async () => {
    const organisationId = await createOrganisation(app());

    const { rows } = await withClient(database().ownerUrl, (client) =>
      client.query<{ organisation_id: string; wrapped_key: Buffer }>(
        'SELECT organisation_id, wrapped_key FROM organisation_keys',
      ),
    );

    expect(rows.map((row) => row.organisation_id)).toEqual([organisationId]);
    const [{ wrapped_key: wrappedKey }] = rows as [(typeof rows)[number]];
    const dataKey = unwrapDataKey(app().get(KeyProvider).masterKey(), wrappedKey, organisationId).export();
    expect(dataKey).toHaveLength(32);
    expect(wrappedKey.includes(dataKey)).toBe(false);
  });

  it("decrypts a value only with its own Organisation's key", async () => {
    const organisationA = await createOrganisation(app());
    const organisationB = await createOrganisation(app());

    const encrypted = await withCipher(organisationA, (cipher) => cipher.encrypt(RODNE_CISLO));

    expect(await withCipher(organisationA, (cipher) => cipher.decrypt(encrypted))).toBe(RODNE_CISLO);
    await expect(withCipher(organisationB, (cipher) => cipher.decrypt(encrypted))).rejects.toThrow(
      'A value failed to decrypt: wrong key, or altered ciphertext',
    );
  });

  it('stores an encrypted column as ciphertext that only the app decrypts', async () => {
    await createNotesTable(database().ownerUrl);
    const organisationId = await createOrganisation(app());
    const unitOfWork = app().get(UnitOfWork);
    const encryption = app().get(EncryptionService);

    await unitOfWork.run(organisationId, async () => {
      const cipher = await encryption.cipher();
      await unitOfWork.db
        .insert(notes)
        .values({ organisationId, text: 'rodné číslo', secret: cipher.encrypt(RODNE_CISLO) });
    });

    const { rows } = await withClient(database().ownerUrl, (client) =>
      client.query<{ secret: Buffer }>('SELECT secret FROM test_notes'),
    );
    expect(rows).toHaveLength(1);
    expect(rows[0]?.secret.includes(RODNE_CISLO)).toBe(false);

    const decrypted = await unitOfWork.run(organisationId, async () => {
      const cipher = await encryption.cipher();
      const stored = await unitOfWork.db.select({ secret: notes.secret }).from(notes);

      return stored.map(({ secret }) => (secret === null ? null : cipher.decrypt(secret)));
    });
    expect(decrypted).toEqual([RODNE_CISLO]);
  });

  it('fails to decrypt with a clear error once the data key is destroyed', async () => {
    const organisationId = await createOrganisation(app());
    const encrypted = await withCipher(organisationId, (cipher) => cipher.encrypt(RODNE_CISLO));

    await withClient(database().appUrl, (client) =>
      client.query('DELETE FROM organisation_keys WHERE organisation_id = $1', [organisationId]),
    );

    await expect(withCipher(organisationId, (cipher) => cipher.decrypt(encrypted))).rejects.toThrow(
      "The Organisation's data key is destroyed; its encrypted data cannot be decrypted",
    );
  });

  it('never lets the app replace a data key', async () => {
    await createOrganisation(app());

    await expect(
      withClient(database().appUrl, (client) => client.query("UPDATE organisation_keys SET wrapped_key = '\\x00'")),
    ).rejects.toThrow(/permission denied/);
  });
});
