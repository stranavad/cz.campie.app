import { Body, Controller, HttpCode, NotFoundException, Param, Patch } from '@nestjs/common';
import { eq, sql } from 'drizzle-orm';
import { beforeEach, describe, expect, it } from 'vitest';

import { auditEntries } from '../../db/schema.ts';
import { createAdmin, createOrganisation } from '../../testing/fixtures.ts';
import { withClient } from '../../testing/services/postgres.ts';
import { createNotesTable, notes } from '../../testing/tenant-table.ts';
import { useTestApp } from '../../testing/test-app.ts';
import { Access } from '../access/access.decorator.ts';
import { Requires } from '../access/permission.ts';
import { RequestActor } from '../access/request-actor.decorator.ts';
import { UnitOfWork } from '../database/unit-of-work.ts';
import { EncryptionService } from '../encryption/encryption.service.ts';
import type { Actor } from './actor.ts';
import { AuditService } from './audit.service.ts';

// Obviously fake: no real person has this rodné číslo.
const RODNE_CISLO = '000101/0000';

// A sample endpoint that changes an Organisation-owned row and audits the change in the same unit of work.
@Access('admin')
@Requires('member')
@Controller('test-notes')
class NotesController {
  constructor(
    private readonly unitOfWork: UnitOfWork,
    private readonly audit: AuditService,
    private readonly encryption: EncryptionService,
  ) {}

  @Patch(':id')
  @HttpCode(204)
  public async update(
    @RequestActor() actor: Actor,
    @Param('id') id: string,
    @Body() body: { text?: string; secret?: string; fail?: boolean },
  ): Promise<void> {
    const [before] = await this.unitOfWork.db.select().from(notes).where(eq(notes.id, id));

    if (before === undefined) {
      throw new NotFoundException();
    }

    const cipher = await this.encryption.cipher();
    const [after] = await this.unitOfWork.db
      .update(notes)
      .set({ text: body.text, secret: body.secret === undefined ? undefined : cipher.encrypt(body.secret) })
      .where(eq(notes.id, id))
      .returning();

    // A note stands in for a Camp: the audit log records only the catalogue's actions.
    await this.audit.record(actor, {
      action: 'camp.update',
      target: { type: 'camp', id },
      change: { before, after: after ?? null },
    });

    if (body.fail === true) {
      throw new Error('The change failed after it was audited');
    }
  }
}

interface AuditRow {
  organisation_id: string;
  occurred_at: Date;
  actor_kind: string;
  actor_identity: string | null;
  ip_address: string | null;
  action: string;
  target_type: string;
  target_id: string;
  changes: unknown;
  encrypted_fields: string[];
}

describe('audit log', () => {
  const { app, http, clock, database } = useTestApp({ controllers: [NotesController] });
  let organisationId: string;
  let noteId: string;
  let admin: Awaited<ReturnType<typeof createAdmin>>;

  const auditRows = () =>
    withClient(
      database().ownerUrl,
      async (client) => (await client.query<AuditRow>('SELECT * FROM audit_entries')).rows,
    );

  // Change the note through the sample endpoint, as an admin of its Organisation.
  const patchNote = (body: { text?: string; secret?: string; fail?: boolean }) =>
    http().patch(`/api/test-notes/${noteId}`).set(admin.headers(organisationId)).send(body);

  // Run a statement as the application role in the Organisation's unit of work, expecting it refused.
  const expectDenied = async (statement: () => Promise<unknown>) => {
    const unitOfWork = app().get(UnitOfWork);

    await expect(unitOfWork.run(organisationId, statement)).rejects.toMatchObject({
      cause: { message: expect.stringMatching(/permission denied/) },
    });
  };

  beforeEach(async () => {
    await createNotesTable(database().ownerUrl);
    organisationId = await createOrganisation(app());
    admin = await createAdmin(app(), { memberOf: [organisationId] });

    const unitOfWork = app().get(UnitOfWork);
    const [note] = await unitOfWork.run(organisationId, () =>
      unitOfWork.db.insert(notes).values({ organisationId, text: 'packing list' }).returning(),
    );

    if (note === undefined) {
      throw new Error('The note was not created');
    }

    noteId = note.id;
  });

  it('records a change with its actor, action, target, time, IP address and old and new values', async () => {
    clock().set(new Date('2027-02-01T09:30:00Z'));
    // Signed in again: the session from before the clock moved has expired.
    admin = await createAdmin(app(), { memberOf: [organisationId] });

    await patchNote({ text: 'packing list, with torch' }).expect(204);

    expect(await auditRows()).toEqual([
      expect.objectContaining({
        organisation_id: organisationId,
        occurred_at: new Date('2027-02-01T09:30:00Z'),
        actor_kind: 'admin',
        actor_identity: admin.id,
        ip_address: expect.stringMatching(/127\.0\.0\.1$/),
        action: 'camp.update',
        target_type: 'camp',
        target_id: noteId,
        changes: { text: { old: 'packing list', new: 'packing list, with torch' } },
        encrypted_fields: [],
      }),
    ]);
  });

  it('names a changed encrypted field without its plaintext or ciphertext', async () => {
    await patchNote({ secret: RODNE_CISLO }).expect(204);

    const ciphertext = await withClient(database().ownerUrl, async (client) => {
      const { rows } = await client.query<{ secret: Buffer }>('SELECT secret FROM test_notes');

      return rows[0]?.secret;
    });
    const [entry] = await withClient(
      database().ownerUrl,
      async (client) =>
        (await client.query<{ entry: string }>('SELECT to_jsonb(e)::text AS entry FROM audit_entries e')).rows,
    );

    expect(await auditRows()).toEqual([expect.objectContaining({ changes: {}, encrypted_fields: ['secret'] })]);
    expect(ciphertext).toBeInstanceOf(Buffer);
    expect(entry?.entry).not.toContain(RODNE_CISLO);
    expect(entry?.entry).not.toContain(ciphertext?.toString('hex'));
    expect(entry?.entry).not.toContain(ciphertext?.toString('base64'));
  });

  it('leaves no entry when the change rolls back', async () => {
    await patchNote({ text: 'packing list, with torch', fail: true }).expect(500);

    expect(await auditRows()).toEqual([]);
  });

  it('never lets the application role update or delete an entry', async () => {
    await patchNote({ text: 'packing list, with torch' }).expect(204);
    const unitOfWork = app().get(UnitOfWork);

    await expectDenied(() => unitOfWork.db.update(auditEntries).set({ action: 'note.forged' }));
    await expectDenied(() => unitOfWork.db.delete(auditEntries));
    await expectDenied(() => unitOfWork.db.execute(sql`truncate audit_entries`));
    expect(await auditRows()).toEqual([expect.objectContaining({ action: 'camp.update' })]);
  });

  it('shows an Organisation only its own entries', async () => {
    const otherOrganisationId = await createOrganisation(app());
    await patchNote({ text: 'packing list, with torch' }).expect(204);
    const unitOfWork = app().get(UnitOfWork);

    const read = (id: string) =>
      unitOfWork.run(id, () => unitOfWork.db.select({ action: auditEntries.action }).from(auditEntries));

    expect(await read(organisationId)).toEqual([{ action: 'camp.update' }]);
    expect(await read(otherOrganisationId)).toEqual([]);
  });
});
