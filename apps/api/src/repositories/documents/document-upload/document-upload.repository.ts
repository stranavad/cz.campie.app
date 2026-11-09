import { Injectable } from '@nestjs/common';
import { and, count, desc, eq, inArray, isNull, type InferInsertModel, type InferSelectModel } from 'drizzle-orm';

import { UnitOfWork } from '../../../core/database/unit-of-work.ts';
import { documentUploads, internalDocuments, participants, registrations, turnusy } from '../../../db/schema.ts';

export type DocumentUploadRow = InferSelectModel<typeof documentUploads>;
export type InternalDocumentRow = InferSelectModel<typeof internalDocuments>;
export type UploadStatus = DocumentUploadRow['status'];
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
   * Count, per requirement and status, the newest documents of the Registered Participants of every Turnus
   * of a Camp, in one query; Erased Registrations left out.
   * @param campId Camp id
   */
  public async countNewestInCamp(
    campId: string,
  ): Promise<{ documentTypeId: string; status: UploadStatus; count: number }[]> {
    const newest = this.unitOfWork.db
      .selectDistinctOn([documentUploads.participantId, documentUploads.documentTypeId], {
        documentTypeId: documentUploads.documentTypeId,
        status: documentUploads.status,
      })
      .from(documentUploads)
      .innerJoin(participants, eq(participants.id, documentUploads.participantId))
      .innerJoin(registrations, eq(registrations.id, participants.registrationId))
      .innerJoin(turnusy, eq(turnusy.id, registrations.turnusId))
      .where(and(eq(turnusy.campId, campId), eq(participants.status, 'registered'), isNull(registrations.erasedAt)))
      .orderBy(
        documentUploads.participantId,
        documentUploads.documentTypeId,
        desc(documentUploads.uploadedAt),
        desc(documentUploads.id),
      )
      .as('newest');

    return this.unitOfWork.db
      .select({ documentTypeId: newest.documentTypeId, status: newest.status, count: count() })
      .from(newest)
      .groupBy(newest.documentTypeId, newest.status);
  }

  /**
   * Count the documents of Participants waiting for review, in one query: each requirement's newest only, as
   * one handed in over a waiting document leaves that one for good.
   * @param participantIds Participant ids
   */
  public async countPendingOf(participantIds: readonly string[]): Promise<number> {
    if (participantIds.length === 0) {
      return 0;
    }

    const newest = this.unitOfWork.db
      .selectDistinctOn([documentUploads.participantId, documentUploads.documentTypeId], {
        status: documentUploads.status,
      })
      .from(documentUploads)
      .where(inArray(documentUploads.participantId, [...participantIds]))
      .orderBy(
        documentUploads.participantId,
        documentUploads.documentTypeId,
        desc(documentUploads.uploadedAt),
        desc(documentUploads.id),
      )
      .as('newest');
    const [row] = await this.unitOfWork.db
      .select({ pending: count() })
      .from(newest)
      .where(eq(newest.status, 'pending'));

    return row?.pending ?? 0;
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
   * Get a handed-in document of the current Organisation.
   * @param id document id
   */
  public async getById(id: string): Promise<DocumentUploadRow | null> {
    const [row] = await this.unitOfWork.db.select().from(documentUploads).where(eq(documentUploads.id, id));

    return row ?? null;
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
   * Put another file in place of a handed-in document's, with who handed it in and when.
   * @param id document id
   * @param replacement the new file, the guardian's email and the instant
   * @throws {Error} when the database returns no row
   */
  public async replaceFile(
    id: string,
    replacement: { fileId: string; uploadedByEmail: string; uploadedAt: Date },
  ): Promise<DocumentUploadRow> {
    const [row] = await this.unitOfWork.db
      .update(documentUploads)
      .set(replacement)
      .where(eq(documentUploads.id, id))
      .returning();

    if (row === undefined) {
      throw new Error('The document was not replaced');
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
   * Get an Internal document of the current Organisation.
   * @param id Internal document id
   */
  public async getInternalById(id: string): Promise<InternalDocumentRow | null> {
    const [row] = await this.unitOfWork.db.select().from(internalDocuments).where(eq(internalDocuments.id, id));

    return row ?? null;
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
