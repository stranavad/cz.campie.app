import { Controller, Delete, Get, Headers, HttpCode, NotFoundException, Param } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { beforeEach, describe, expect, it } from 'vitest';

import { UnitOfWork } from '../core/database/unit-of-work.ts';
import { createOrganisation } from './fixtures.ts';
import { createNotesTable, notes } from './tenant-table.ts';
import { useTestApp } from './test-app.ts';

// Test only: stands in for a session until sessions exist. Real routes never take the Organisation from
// client input.
const ORGANISATION = 'x-test-organisation';

// A sample endpoint over an Organisation-owned table, with the two bugs the isolation helper exists to
// catch: an Organisation taken from client input, and a write that answers not-found anyway.
@Controller('test-notes')
class NotesController {
  constructor(private readonly unitOfWork: UnitOfWork) {}

  @Get(':id')
  public get(@Headers(ORGANISATION) organisationId: string, @Param('id') id: string) {
    return this.unitOfWork.run(organisationId, async () => {
      const [note] = await this.unitOfWork.db.select().from(notes).where(eq(notes.id, id));

      if (note === undefined) {
        throw new NotFoundException();
      }

      return note;
    });
  }

  @Delete(':id')
  @HttpCode(204)
  public async remove(@Headers(ORGANISATION) organisationId: string, @Param('id') id: string): Promise<void> {
    await this.unitOfWork.run(organisationId, async () => {
      const deleted = await this.unitOfWork.db.delete(notes).where(eq(notes.id, id)).returning();

      if (deleted.length === 0) {
        throw new NotFoundException();
      }
    });
  }

  @Get(':organisationId/:id')
  public getFromPath(@Param('organisationId') organisationId: string, @Param('id') id: string) {
    return this.unitOfWork.run(organisationId, async () => {
      const [note] = await this.unitOfWork.db.select().from(notes).where(eq(notes.id, id));

      return note;
    });
  }

  @Delete(':organisationId/:id')
  public async removeFromPath(@Param('organisationId') organisationId: string, @Param('id') id: string) {
    await this.unitOfWork.run(organisationId, () =>
      this.unitOfWork.db.delete(notes).where(and(eq(notes.id, id), eq(notes.organisationId, organisationId))),
    );

    throw new NotFoundException();
  }
}

describe('tenant isolation helper', () => {
  const { app, http, database, expectIsolated } = useTestApp({ controllers: [NotesController] });
  let organisationA: string;
  let organisationB: string;
  let noteOfA: string;

  beforeEach(async () => {
    await createNotesTable(database().ownerUrl);
    organisationA = await createOrganisation(app());
    organisationB = await createOrganisation(app());

    const unitOfWork = app().get(UnitOfWork);
    const [note] = await unitOfWork.run(organisationA, () =>
      unitOfWork.db.insert(notes).values({ organisationId: organisationA, text: 'note of A' }).returning(),
    );

    if (note === undefined) {
      throw new Error('The note of A was not created');
    }

    noteOfA = note.id;
  });

  it("passes an endpoint that answers another Organisation's ids with not-found and changes nothing", async () => {
    await expectIsolated(() => http().get(`/api/test-notes/${noteOfA}`).set(ORGANISATION, organisationB));
    await expectIsolated(() => http().delete(`/api/test-notes/${noteOfA}`).set(ORGANISATION, organisationB));

    const own = await http().get(`/api/test-notes/${noteOfA}`).set(ORGANISATION, organisationA);
    expect(own.body).toMatchObject({ text: 'note of A' });
  });

  it('fails an endpoint that answers with the data of another Organisation', async () => {
    await expect(
      expectIsolated(() => http().get(`/api/test-notes/${organisationA}/${noteOfA}`).set(ORGANISATION, organisationB)),
    ).rejects.toThrow(/answered 200/);
  });

  it('fails an endpoint that answers not-found but changed the data of another Organisation', async () => {
    await expect(
      expectIsolated(() =>
        http().delete(`/api/test-notes/${organisationA}/${noteOfA}`).set(ORGANISATION, organisationB),
      ),
    ).rejects.toThrow(/changed/);
  });
});
