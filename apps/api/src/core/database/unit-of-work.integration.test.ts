import { setTimeout as sleep } from 'node:timers/promises';
import { eq, sql } from 'drizzle-orm';
import { beforeEach, describe, expect, it } from 'vitest';

import { organisations } from '../../db/schema.ts';
import { withClient } from '../../testing/services/postgres.ts';
import { createNotesTable, notes } from '../../testing/tenant-table.ts';
import { useTestApp } from '../../testing/test-app.ts';
import { UnitOfWork } from './unit-of-work.ts';

const ORG_A = '01900000-0000-7000-8000-00000000000a';
const ORG_B = '01900000-0000-7000-8000-00000000000b';
const NOTE_A = '01900000-0000-7000-8000-0000000000a1';
const NOTE_B = '01900000-0000-7000-8000-0000000000b1';

describe('unit of work', () => {
  const { app, database } = useTestApp();

  beforeEach(async () => {
    await createNotesTable(database().ownerUrl);
    await withClient(database().ownerUrl, async (client) => {
      await client.query('INSERT INTO organisations (id) VALUES ($1), ($2)', [ORG_A, ORG_B]);
      await client.query(
        `INSERT INTO test_notes (id, organisation_id, text) VALUES ($1, $2, 'note of A'), ($3, $4, 'note of B')`,
        [NOTE_A, ORG_A, NOTE_B, ORG_B],
      );
    });
  });

  it('shows no Organisation rows and rejects inserts outside a unit of work', async () => {
    await withClient(database().appUrl, async (client) => {
      const { rows } = await client.query('SELECT * FROM test_notes');
      expect(rows).toEqual([]);

      await expect(
        client.query(`INSERT INTO test_notes (organisation_id, text) VALUES ($1, 'stray')`, [ORG_A]),
      ).rejects.toThrow(/row-level security/);
    });
  });

  it('admits only the current Organisation, even for writes naming another one by id', async () => {
    const unitOfWork = app().get(UnitOfWork);

    await unitOfWork.run(ORG_A, async () => {
      const { db } = unitOfWork;

      expect(await db.select({ text: notes.text }).from(notes)).toEqual([{ text: 'note of A' }]);
      expect(await db.update(notes).set({ text: 'changed' }).where(eq(notes.id, NOTE_B)).returning()).toEqual([]);
      expect(await db.delete(notes).where(eq(notes.id, NOTE_B)).returning()).toEqual([]);
    });
    await expect(
      unitOfWork.run(ORG_A, () => unitOfWork.db.insert(notes).values({ organisationId: ORG_B, text: 'planted' })),
    ).rejects.toMatchObject({ cause: { message: expect.stringMatching(/row-level security/) } });

    await withClient(database().ownerUrl, async (client) => {
      const { rows } = await client.query('SELECT text FROM test_notes WHERE organisation_id = $1', [ORG_B]);
      expect(rows).toEqual([{ text: 'note of B' }]);
    });
  });

  it('keeps concurrent units of work for different Organisations apart', async () => {
    const unitOfWork = app().get(UnitOfWork);
    const readAfterOthersStart = (organisationId: string, delay: number) =>
      unitOfWork.run(organisationId, async () => {
        await sleep(delay);

        return (await unitOfWork.db.select({ text: notes.text }).from(notes)).map((note) => note.text);
      });

    const seen = await Promise.all(
      Array.from({ length: 10 }, (_, index) => readAfterOthersStart(index % 2 === 0 ? ORG_A : ORG_B, 20 - index * 2)),
    );

    expect(seen).toEqual(Array.from({ length: 10 }, (_, index) => [index % 2 === 0 ? 'note of A' : 'note of B']));
  });

  it('rolls back everything when its work throws', async () => {
    const unitOfWork = app().get(UnitOfWork);

    await expect(
      unitOfWork.run(ORG_A, async () => {
        await unitOfWork.db.insert(notes).values({ organisationId: unitOfWork.organisationId, text: 'half done' });
        throw new Error('work failed');
      }),
    ).rejects.toThrow('work failed');

    const texts = await unitOfWork.run(ORG_A, async () => unitOfWork.db.select({ text: notes.text }).from(notes));
    expect(texts).toEqual([{ text: 'note of A' }]);
  });

  it('reaches platform tables but no Organisation rows in a platform unit of work', async () => {
    const unitOfWork = app().get(UnitOfWork);

    await unitOfWork.runForPlatform(async () => {
      const created = await unitOfWork.db.insert(organisations).values({}).returning();
      expect(created).toEqual([{ id: expect.stringMatching(/^[0-9a-f]{8}-[0-9a-f]{4}-7/) }]);
      expect(await unitOfWork.db.select().from(organisations)).toHaveLength(3);
      expect(await unitOfWork.db.select().from(notes)).toEqual([]);
      expect(() => unitOfWork.organisationId).toThrow('A platform unit of work has no Organisation');
    });
    expect(() => unitOfWork.db).toThrow('No unit of work is open');
  });

  it('connects as a role that cannot bypass row-level security and owns no table', async () => {
    const unitOfWork = app().get(UnitOfWork);
    const [connected] = await unitOfWork.run(ORG_A, () =>
      unitOfWork.db.select({ role: sql<string>`current_user` }).from(notes),
    );
    const role = connected?.role;

    await withClient(database().ownerUrl, async (client) => {
      const { rows } = await client.query(
        `SELECT r.rolsuper, r.rolbypassrls,
           (SELECT count(*)::int FROM pg_class c WHERE c.relowner = r.oid) AS owned,
           pg_has_role(r.oid, (SELECT relowner FROM pg_class WHERE oid = 'organisations'::regclass), 'MEMBER') AS owner_member
         FROM pg_roles r WHERE r.rolname = $1`,
        [role],
      );
      expect(rows).toEqual([{ rolsuper: false, rolbypassrls: false, owned: 0, owner_member: false }]);
    });
    expect(role).toBe('campie_app');
  });
});
