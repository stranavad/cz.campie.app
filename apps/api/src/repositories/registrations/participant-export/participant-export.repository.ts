import { Injectable } from '@nestjs/common';
import { and, eq, type InferSelectModel } from 'drizzle-orm';

import { UnitOfWork } from '../../../core/database/unit-of-work.ts';
import { participantExports } from '../../../db/schema.ts';

export type ParticipantExportRow = InferSelectModel<typeof participantExports>;

@Injectable()
export class ParticipantExportRepository {
  constructor(private readonly unitOfWork: UnitOfWork) {}

  /**
   * Record an export an admin started in the current Organisation, waiting for its job.
   * @param input the admin, the Turnus and when
   */
  public async create(input: { adminId: string; turnusId: string; createdAt: Date }): Promise<ParticipantExportRow> {
    const [row] = await this.unitOfWork.db
      .insert(participantExports)
      .values({ ...input, organisationId: this.unitOfWork.organisationId })
      .returning();

    if (row === undefined) {
      throw new Error('The export was not recorded');
    }

    return row;
  }

  /**
   * Get an export of the current Organisation.
   * @param id export id
   */
  public async getById(id: string): Promise<ParticipantExportRow | null> {
    const [row] = await this.unitOfWork.db.select().from(participantExports).where(eq(participantExports.id, id));

    return row ?? null;
  }

  /**
   * Get an export of the current Organisation and lock it until the unit of work ends, so one job builds it.
   * @param id export id
   */
  public async getByIdForUpdate(id: string): Promise<ParticipantExportRow | null> {
    const [row] = await this.unitOfWork.db
      .select()
      .from(participantExports)
      .where(eq(participantExports.id, id))
      .for('update');

    return row ?? null;
  }

  /**
   * Get an export of a Turnus the admin started that is still waiting for its job.
   * @param adminId the admin
   * @param turnusId Turnus id
   */
  public async getPending(adminId: string, turnusId: string): Promise<ParticipantExportRow | null> {
    const [row] = await this.unitOfWork.db
      .select()
      .from(participantExports)
      .where(
        and(
          eq(participantExports.adminId, adminId),
          eq(participantExports.turnusId, turnusId),
          eq(participantExports.status, 'pending'),
        ),
      )
      .limit(1);

    return row ?? null;
  }

  /**
   * Mark an export ready with its stored file.
   * @param id export id
   * @param fileId the stored spreadsheet
   */
  public async complete(id: string, fileId: string): Promise<void> {
    await this.unitOfWork.db
      .update(participantExports)
      .set({ status: 'ready', fileId })
      .where(eq(participantExports.id, id));
  }
}
