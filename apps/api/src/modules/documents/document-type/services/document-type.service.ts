import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';

import type { DocumentType, DocumentTypeBody, DocumentTypeErrorCode } from '@repo/schema/documents';

import type { Actor } from '../../../../core/audit/actor.ts';
import { AuditService } from '../../../../core/audit/audit.service.ts';
import type { FileUpload } from '../../../../core/files/file-upload.ts';
import { FileService } from '../../../../core/files/file.service.ts';
import { Clock } from '../../../../core/ports/clock/clock.port.ts';
import { CampRepository } from '../../../../repositories/camps/camp/camp.repository.ts';
import { TurnusRepository } from '../../../../repositories/camps/turnus/turnus.repository.ts';
import {
  DocumentTypeRepository,
  type DocumentTypeRow,
} from '../../../../repositories/documents/document-type/document-type.repository.ts';
import { DocumentUploadRepository } from '../../../../repositories/documents/document-upload/document-upload.repository.ts';

// A Camp's Document types: downloads it publishes, optionally for chosen Turnusy, and requirements each
// child hands in. Permission (Camp settings) is the route's.
@Injectable()
export class DocumentTypeService {
  constructor(
    private readonly types: DocumentTypeRepository,
    private readonly camps: CampRepository,
    private readonly turnusy: TurnusRepository,
    private readonly uploads: DocumentUploadRepository,
    private readonly files: FileService,
    private readonly audit: AuditService,
    private readonly clock: Clock,
  ) {}

  /**
   * List a Camp's Document types with links to their files.
   * @param campId Camp id
   */
  public async list(campId: string): Promise<DocumentType[]> {
    await this.camps.getByIdOrThrow(campId);

    return Promise.all((await this.types.listByCamp(campId)).map((type) => this.show(type)));
  }

  /**
   * Create a Document type of a Camp, audited.
   * @param actor who does it
   * @param campId Camp id
   * @param body its kind, name, description, due date and Turnusy
   */
  public async create(actor: Actor, campId: string, body: DocumentTypeBody): Promise<DocumentType> {
    await this.camps.getByIdOrThrow(campId);
    await this.checkTurnusy(campId, body.turnusIds);
    const created = await this.types.create(campId, body, this.clock.now());

    await this.audit.record(actor, {
      action: 'document_type.create',
      target: { type: 'document_type', id: created.id },
      change: { before: null, after: created },
    });

    return this.show(created);
  }

  /**
   * Change a Document type, audited with old and new values.
   * @param actor who does it
   * @param campId Camp id
   * @param documentTypeId Document type id
   * @param body its kind, name, description, due date and Turnusy
   */
  public async update(
    actor: Actor,
    campId: string,
    documentTypeId: string,
    body: DocumentTypeBody,
  ): Promise<DocumentType> {
    const before = await this.types.lockOrThrow(campId, documentTypeId);

    await this.checkTurnusy(campId, body.turnusIds);

    return this.change(actor, before, body);
  }

  /**
   * Replace a Document type's file by an uploaded PDF, JPG or PNG, audited; the old file is removed.
   * @param actor who does it
   * @param campId Camp id
   * @param documentTypeId Document type id
   * @param upload the file
   */
  public async setFile(
    actor: Actor,
    campId: string,
    documentTypeId: string,
    upload: FileUpload,
  ): Promise<DocumentType> {
    // Stored before the lock, so others wait only for the change; a refusal rolls the stored object back.
    const fileId = await this.files.store(upload);
    const before = await this.types.lockOrThrow(campId, documentTypeId);

    return this.change(actor, before, { fileId });
  }

  /**
   * Remove a Document type's file, audited.
   * @param actor who does it
   * @param campId Camp id
   * @param documentTypeId Document type id
   */
  public async removeFile(actor: Actor, campId: string, documentTypeId: string): Promise<DocumentType> {
    const before = await this.types.lockOrThrow(campId, documentTypeId);

    return this.change(actor, before, { fileId: null });
  }

  /**
   * Remove a Document type and its file, audited, while nothing was handed in for it.
   * @param actor who does it
   * @param campId Camp id
   * @param documentTypeId Document type id
   * @throws {ConflictException} document_type_in_use when documents were handed in for it
   */
  public async remove(actor: Actor, campId: string, documentTypeId: string): Promise<void> {
    const before = await this.types.lockOrThrow(campId, documentTypeId);

    if (await this.uploads.existsFor(before.id)) {
      const code: DocumentTypeErrorCode = 'document_type_in_use';

      throw new ConflictException({ code, message: 'Documents were handed in for the Document type' });
    }

    await this.types.remove(before.id);

    if (before.fileId !== null) {
      await this.files.remove(before.fileId);
    }

    await this.audit.record(actor, {
      action: 'document_type.remove',
      target: { type: 'document_type', id: before.id },
      change: { before, after: null },
    });
  }

  /**
   * Change a Document type, audited; a file it replaces or drops is removed.
   * @param actor who does it
   * @param before the Document type as it is
   * @param changes the fields or file to change
   */
  private async change(
    actor: Actor,
    before: DocumentTypeRow,
    changes: Partial<DocumentTypeBody> & { fileId?: string | null },
  ): Promise<DocumentType> {
    const after = await this.types.update(before.id, changes);

    if (before.fileId !== null && before.fileId !== after.fileId) {
      await this.files.remove(before.fileId);
    }

    await this.audit.record(actor, {
      action: 'document_type.update',
      target: { type: 'document_type', id: before.id },
      change: { before, after },
    });

    return this.show(after);
  }

  /**
   * Check that the Turnusy a download names are the Camp's.
   * @param campId Camp id
   * @param turnusIds the Turnusy named
   * @throws {BadRequestException} document_type_turnus_unknown when one is not the Camp's
   */
  private async checkTurnusy(campId: string, turnusIds: readonly string[]): Promise<void> {
    if (turnusIds.length === 0) {
      return;
    }

    const own = new Set((await this.turnusy.listByCamp(campId)).map(({ id }) => id));

    if (turnusIds.some((id) => !own.has(id))) {
      const code: DocumentTypeErrorCode = 'document_type_turnus_unknown';

      throw new BadRequestException({ code, message: 'A Turnus named is not one of the Camp' });
    }
  }

  /**
   * Show a Document type with a short-lived link to its file.
   * @param type the Document type
   */
  private async show(type: DocumentTypeRow): Promise<DocumentType> {
    return {
      id: type.id,
      kind: type.kind,
      name: type.name,
      description: type.description,
      dueDate: type.dueDate,
      turnusIds: type.turnusIds,
      file: type.fileId === null ? null : { id: type.fileId, link: await this.files.link(type.fileId) },
    };
  }
}
