import { Injectable, NotFoundException } from '@nestjs/common';
import { eq, inArray, type InferInsertModel } from 'drizzle-orm';

import { UnitOfWork } from '../../../core/database/unit-of-work.ts';
import { files } from '../../../db/schema.ts';
import { FileEntity } from './file.entity.ts';

@Injectable()
export class FileRepository {
  constructor(private readonly unitOfWork: UnitOfWork) {}

  /**
   * Get a file record by id, or throw if missing.
   * @param id file id
   * @throws {NotFoundException} when no file has this id in the current Organisation
   */
  public async getByIdOrThrow(id: string): Promise<FileEntity> {
    const [row] = await this.unitOfWork.db.select().from(files).where(eq(files.id, id));

    if (row === undefined) {
      throw new NotFoundException();
    }

    return new FileEntity(row);
  }

  /**
   * Create a file record in the current Organisation.
   * @param input the record, without its Organisation
   * @throws {Error} when the database returns no row
   */
  /**
   * List which of file ids exist in the current Organisation, in one query.
   * @param ids file ids
   */
  public async listExisting(ids: readonly string[]): Promise<string[]> {
    if (ids.length === 0) {
      return [];
    }

    const rows = await this.unitOfWork.db
      .select({ id: files.id })
      .from(files)
      .where(inArray(files.id, [...new Set(ids)]));

    return rows.map(({ id }) => id);
  }

  public async create(input: Omit<InferInsertModel<typeof files>, 'id' | 'organisationId'>): Promise<FileEntity> {
    const [row] = await this.unitOfWork.db
      .insert(files)
      .values({ ...input, organisationId: this.unitOfWork.organisationId })
      .returning();

    if (row === undefined) {
      throw new Error('The file record was not created');
    }

    return new FileEntity(row);
  }

  /**
   * Remove a file record.
   * @param id file id
   * @throws {NotFoundException} when no file has this id in the current Organisation
   */
  public async remove(id: string): Promise<void> {
    const removed = await this.unitOfWork.db.delete(files).where(eq(files.id, id)).returning({ id: files.id });

    if (removed.length === 0) {
      throw new NotFoundException();
    }
  }
}
