import { Injectable } from '@nestjs/common';
import { and, desc, eq, inArray, type InferInsertModel, type InferSelectModel } from 'drizzle-orm';

import { UnitOfWork } from '../../../core/database/unit-of-work.ts';
import { documentUploads, internalDocuments } from '../../../db/schema.ts';

export type DocumentUploadRow = InferSelectModel<typeof documentUploads>;
export type InternalDocumentRow = InferSelectModel<typeof internalDocuments>;
export type CreateDocumentUpload = Omit<InferInsertModel<typeof documentUploads>, 'id' | 'organisationId'>;

@Injectable()
export class DocumentUploadRepository {
  constructor(private readonly unitOfWork: UnitOfWork) {}

  /**
   * Record a handed-in document in the current Organisation.
   * @param input the child, the requirement, the file, who and when
   * @throws {Error} when the database returns no row
   */
  public async create(input: CreateDocumentUpload): Promise<DocumentUploadRow> {
    const [row] = await this.unitOfWork.db
      .insert(documentUploads)
      .values({ ...input, organisationId: this.unitOfWork.organisationId })
      .returning();

    if (row === undefined) {
      throw new Error('The document was not recorded');
    }

    return row;
  }

  /**
   * List the documents handed in for Participants, newest first.
   * @param participantIds Participant ids
   */
  public async listOf(participantIds: readonly string[]): Promise<DocumentUploadRow[]> {
    if (participantIds.length === 0) {
      return [];
    }

    return this.unitOfWork.db
      .select()
      .from(documentUploads)
      .where(inArray(documentUploads.participantId, [...participantIds]))
      .orderBy(desc(documentUploads.uploadedAt), desc(documentUploads.id));
  }

  /**
   * Get the newest document handed in for a child's requirement.
   * @param participantId Participant id
   * @param documentTypeId requirement id
   */
  public async getNewest(participantId: string, documentTypeId: string): Promise<DocumentUploadRow | null> {
    const [row] = await this.unitOfWork.db
      .select()
      .from(documentUploads)
      .where(and(eq(documentUploads.participantId, participantId), eq(documentUploads.documentTypeId, documentTypeId)))
      .orderBy(desc(documentUploads.uploadedAt), desc(documentUploads.id))
      .limit(1);

    return row ?? null;
  }

  /**
   * Tell whether anything was handed in for a Document type.
   * @param documentTypeId Document type id
   */
  public async existsFor(documentTypeId: string): Promise<boolean> {
    const [row] = await this.unitOfWork.db
      .select({ id: documentUploads.id })
      .from(documentUploads)
      .where(eq(documentUploads.documentTypeId, documentTypeId))
      .limit(1);

    return row !== undefined;
  }

  /**
   * Get a handed-in document of the current Organisation and lock it until the unit of work ends.
   * @param id document id
   */
  public async lockById(id: string): Promise<DocumentUploadRow | null> {
    const [row] = await this.unitOfWork.db
      .select()
      .from(documentUploads)
      .where(eq(documentUploads.id, id))
      .for('update');

    return row ?? null;
  }

  /**
   * Set a handed-in document's review.
   * @param id document id
   * @param review its status and the note returning it
   */
  public async review(
    id: string,
    review: { status: DocumentUploadRow['status']; note: string | null },
  ): Promise<DocumentUploadRow> {
    const [row] = await this.unitOfWork.db
      .update(documentUploads)
      .set(review)
      .where(eq(documentUploads.id, id))
      .returning();

    if (row === undefined) {
      throw new Error('The document was not reviewed');
    }

    return row;
  }

  /**
   * Attach an Internal document to a child in the current Organisation.
   * @param input the child, the file, the admin and when
   * @throws {Error} when the database returns no row
   */
  public async addInternal(input: Omit<InternalDocumentRow, 'id' | 'organisationId'>): Promise<InternalDocumentRow> {
    const [row] = await this.unitOfWork.db
      .insert(internalDocuments)
      .values({ ...input, organisationId: this.unitOfWork.organisationId })
      .returning();

    if (row === undefined) {
      throw new Error('The Internal document was not recorded');
    }

    return row;
  }

  /**
   * List the Internal documents of Participants, newest first.
   * @param participantIds Participant ids
   */
  public async listInternalOf(participantIds: readonly string[]): Promise<InternalDocumentRow[]> {
    if (participantIds.length === 0) {
      return [];
    }

    return this.unitOfWork.db
      .select()
      .from(internalDocuments)
      .where(inArray(internalDocuments.participantId, [...participantIds]))
      .orderBy(desc(internalDocuments.uploadedAt), desc(internalDocuments.id));
  }

  /**
   * Remove an Internal document of the current Organisation.
   * @param id Internal document id
   * @returns the removed one, or null when there was none
   */
  public async removeInternal(id: string): Promise<InternalDocumentRow | null> {
    const [row] = await this.unitOfWork.db.delete(internalDocuments).where(eq(internalDocuments.id, id)).returning();

    return row ?? null;
  }
}
