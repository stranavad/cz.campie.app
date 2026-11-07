import { Injectable, NotFoundException } from '@nestjs/common';
import { and, asc, eq, type InferInsertModel, type InferSelectModel } from 'drizzle-orm';

import { UnitOfWork } from '../../../core/database/unit-of-work.ts';
import { documentTypes } from '../../../db/schema.ts';

export type DocumentTypeRow = InferSelectModel<typeof documentTypes>;
export type DocumentTypeFields = Pick<
  InferInsertModel<typeof documentTypes>,
  'kind' | 'name' | 'description' | 'dueDate' | 'turnusIds'
>;

@Injectable()
export class DocumentTypeRepository {
  constructor(private readonly unitOfWork: UnitOfWork) {}

  /**
   * List a Camp's Document types, oldest first.
   * @param campId Camp id
   */
  public async listByCamp(campId: string): Promise<DocumentTypeRow[]> {
    return this.unitOfWork.db
      .select()
      .from(documentTypes)
      .where(eq(documentTypes.campId, campId))
      .orderBy(asc(documentTypes.createdAt), asc(documentTypes.id));
  }

  /**
   * Get a Document type of a Camp and lock it until the unit of work ends.
   * @param campId Camp id
   * @param id Document type id
   * @throws {NotFoundException} when the Camp has no such Document type
   */
  public async lockOrThrow(campId: string, id: string): Promise<DocumentTypeRow> {
    const [row] = await this.unitOfWork.db
      .select()
      .from(documentTypes)
      .where(and(eq(documentTypes.campId, campId), eq(documentTypes.id, id)))
      .for('update');

    if (row === undefined) {
      throw new NotFoundException();
    }

    return row;
  }

  /**
   * Create a Document type of a Camp in the current Organisation.
   * @param campId Camp id
   * @param fields its kind, name, description, due date and Turnusy
   * @param createdAt when
   * @throws {Error} when the database returns no row
   */
  public async create(campId: string, fields: DocumentTypeFields, createdAt: Date): Promise<DocumentTypeRow> {
    const [row] = await this.unitOfWork.db
      .insert(documentTypes)
      .values({ ...fields, campId, createdAt, organisationId: this.unitOfWork.organisationId })
      .returning();

    if (row === undefined) {
      throw new Error('The Document type was not created');
    }

    return row;
  }

  /**
   * Change a Document type.
   * @param id Document type id
   * @param changes its fields, its file or both
   * @throws {NotFoundException} when no Document type has the id
   */
  public async update(
    id: string,
    changes: Partial<DocumentTypeFields> & { fileId?: string | null },
  ): Promise<DocumentTypeRow> {
    const [row] = await this.unitOfWork.db
      .update(documentTypes)
      .set(changes)
      .where(eq(documentTypes.id, id))
      .returning();

    if (row === undefined) {
      throw new NotFoundException();
    }

    return row;
  }

  /**
   * Remove a Document type.
   * @param id Document type id
   */
  public async remove(id: string): Promise<void> {
    await this.unitOfWork.db.delete(documentTypes).where(eq(documentTypes.id, id));
  }
}
