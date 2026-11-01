import { Controller, Delete, Get, HttpCode, NotFoundException, Param } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { beforeEach, describe, expect, it } from 'vitest';

import { Access } from '../core/access/access.decorator.ts';
import { UnitOfWork } from '../core/database/unit-of-work.ts';
import { createAdmin, createOrganisation, type RequestHeaders } from './fixtures.ts';
import { createNotesTable, notes } from './tenant-table.ts';
import { useTestApp } from './test-app.ts';

// A sample endpoint over an Organisation-owned table, in the unit of work of the admin's Organisation.
@Access('admin')
@Controller('test-notes')
class NotesController {
  constructor(private readonly unitOfWork: UnitOfWork) {}

  @Get(':id')
  public async get(@Param('id') id: string) {
    const [note] = await this.unitOfWork.db.select().from(notes).where(eq(notes.id, id));

    if (note === undefined) {
      throw new NotFoundException();
    }

    return note;
  }

  @Delete(':id')
  @HttpCode(204)
  public async remove(@Param('id') id: string): Promise<void> {
    const deleted = await this.unitOfWork.db.delete(notes).where(eq(notes.id, id)).returning();

    if (deleted.length === 0) {
      throw new NotFoundException();
    }
  }
}

// The same endpoint with the two bugs the isolation helper exists to catch: an Organisation taken from
// client input, and a write that answers not-found anyway.
@Access('unscoped')
@Controller('test-notes')
class LeakyNotesController {
  constructor(private readonly unitOfWork: UnitOfWork) {}

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
  const { app, http, database, expectIsolated } = useTestApp({ controllers: [NotesController, LeakyNotesController] });
  let organisationA: string;
  let organisationB: string;
  let noteOfA: string;
  let asA: RequestHeaders;
  let asB: RequestHeaders;

  beforeEach(async () => {
    await createNotesTable(database().ownerUrl);
    organisationA = await createOrganisation(app());
    organisationB = await createOrganisation(app());
    asA = (await createAdmin(app(), { memberOf: [organisationA] })).headers(organisationA);
    asB = (await createAdmin(app(), { memberOf: [organisationB] })).headers(organisationB);

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
    await expectIsolated(() => http().get(`/api/test-notes/${noteOfA}`).set(asB));
    await expectIsolated(() => http().delete(`/api/test-notes/${noteOfA}`).set(asB));

    const own = await http().get(`/api/test-notes/${noteOfA}`).set(asA);
    expect(own.body).toMatchObject({ text: 'note of A' });
  });

  it('fails an endpoint that answers with the data of another Organisation', async () => {
    await expect(
      expectIsolated(() => http().get(`/api/test-notes/${organisationA}/${noteOfA}`).set(asB)),
    ).rejects.toThrow(/answered 200/);
  });

  it('fails an endpoint that answers not-found but changed the data of another Organisation', async () => {
    await expect(
      expectIsolated(() => http().delete(`/api/test-notes/${organisationA}/${noteOfA}`).set(asB)),
    ).rejects.toThrow(/changed/);
  });
});
