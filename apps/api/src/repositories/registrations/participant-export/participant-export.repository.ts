import { Injectable } from '@nestjs/common';
import { and, asc, eq, gt, isNull, type InferInsertModel, type InferSelectModel } from 'drizzle-orm';

import { UnitOfWork } from '../../../core/database/unit-of-work.ts';
import { exportPresets, exportSelections, participantExports } from '../../../db/schema.ts';

export type ParticipantExportRow = InferSelectModel<typeof participantExports>;
type ParticipantExportInsert = InferInsertModel<typeof participantExports>;
export type ExportPresetRow = InferSelectModel<typeof exportPresets>;

@Injectable()
export class ParticipantExportRepository {
  constructor(private readonly unitOfWork: UnitOfWork) {}

  /**
   * Record an export an admin started in the current Organisation, waiting for its job.
   * @param input the admin, the kind, a Participant export's Turnus and columns, and when
   */
  public async create(
    input: Pick<ParticipantExportInsert, 'adminId' | 'kind' | 'turnusId' | 'columns' | 'createdAt'>,
  ): Promise<ParticipantExportRow> {
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
   * @param turnusId Turnus id, or null for the payments export
   * @param since the oldest start still counted; one waiting longer failed
   */
  public async getPending(adminId: string, turnusId: string | null, since: Date): Promise<ParticipantExportRow | null> {
    const [row] = await this.unitOfWork.db
      .select()
      .from(participantExports)
      .where(
        and(
          eq(participantExports.adminId, adminId),
          turnusId === null ? isNull(participantExports.turnusId) : eq(participantExports.turnusId, turnusId),
          eq(participantExports.status, 'pending'),
          gt(participantExports.createdAt, since),
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

  /**
   * Remove an export record.
   * @param id export id
   */
  public async remove(id: string): Promise<void> {
    await this.unitOfWork.db.delete(participantExports).where(eq(participantExports.id, id));
  }

  /**
   * List a Camp's export presets by name.
   * @param campId Camp id
   */
  public async listPresets(campId: string): Promise<ExportPresetRow[]> {
    return this.unitOfWork.db
      .select()
      .from(exportPresets)
      .where(eq(exportPresets.campId, campId))
      .orderBy(asc(exportPresets.name), asc(exportPresets.id));
  }

  /**
   * Save a named preset of columns for a Camp in the current Organisation.
   * @param input the Camp, name, columns, admin and when
   * @throws {Error} when the database returns no row
   */
  public async createPreset(input: Omit<ExportPresetRow, 'id' | 'organisationId'>): Promise<ExportPresetRow> {
    const [row] = await this.unitOfWork.db
      .insert(exportPresets)
      .values({ ...input, organisationId: this.unitOfWork.organisationId })
      .returning();

    if (row === undefined) {
      throw new Error('The preset was not saved');
    }

    return row;
  }

  /**
   * Remove an export preset of the current Organisation.
   * @param id preset id
   * @returns the removed one, or null when there was none
   */
  public async removePreset(id: string): Promise<ExportPresetRow | null> {
    const [row] = await this.unitOfWork.db.delete(exportPresets).where(eq(exportPresets.id, id)).returning();

    return row ?? null;
  }

  /**
   * Get an admin's last choice of columns for a Camp.
   * @param adminId the admin
   * @param campId Camp id
   */
  public async getSelection(adminId: string, campId: string): Promise<string[] | null> {
    const [row] = await this.unitOfWork.db
      .select({ columns: exportSelections.columns })
      .from(exportSelections)
      .where(and(eq(exportSelections.adminId, adminId), eq(exportSelections.campId, campId)));

    return row?.columns ?? null;
  }

  /**
   * Remember an admin's choice of columns for a Camp.
   * @param input the admin, Camp, columns and when
   */
  public async saveSelection(input: {
    adminId: string;
    campId: string;
    columns: string[];
    updatedAt: Date;
  }): Promise<void> {
    await this.unitOfWork.db
      .insert(exportSelections)
      .values({ ...input, organisationId: this.unitOfWork.organisationId })
      .onConflictDoUpdate({
        target: [exportSelections.organisationId, exportSelections.adminId, exportSelections.campId],
        set: { columns: input.columns, updatedAt: input.updatedAt },
      });
  }
}
