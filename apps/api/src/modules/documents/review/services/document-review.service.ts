import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';

import type {
  AdminUpload,
  ChildParams,
  ChildRequirementParams,
  InternalDocument,
  RegistrationDocuments,
  ReturnDocumentBody,
  ReviewErrorCode,
} from '@repo/schema/documents';

import type { Actor } from '../../../../core/audit/actor.ts';
import { AuditService } from '../../../../core/audit/audit.service.ts';
import type { FileUpload } from '../../../../core/files/file-upload.ts';
import { FileService } from '../../../../core/files/file.service.ts';
import { JobQueue } from '../../../../core/jobs/job-queue.ts';
import { Clock } from '../../../../core/ports/clock/clock.port.ts';
import { TurnusRepository } from '../../../../repositories/camps/turnus/turnus.repository.ts';
import { DocumentTypeRepository } from '../../../../repositories/documents/document-type/document-type.repository.ts';
import {
  DocumentUploadRepository,
  type DocumentUploadRow,
} from '../../../../repositories/documents/document-upload/document-upload.repository.ts';
import type { ParticipantEntity } from '../../../../repositories/registrations/participant/participant.entity.ts';
import { RegistrationRepository } from '../../../../repositories/registrations/registration/registration.repository.ts';
import { CampEmailService } from '../../../camps/camp-email/services/camp-email.service.ts';
import { sendDocumentReturnedJob } from '../document-returned.job.ts';

/**
 * Refuse a review of a document that changed meanwhile.
 */
function stale(): ConflictException {
  const code: ReviewErrorCode = 'document_review_stale';

  return new ConflictException({ code, message: 'The document cannot be reviewed so' });
}

// Admins reviewing what guardians handed in, handing in on their behalf, and keeping Internal documents
// that no guardian endpoint reads. Permission (Registrations read or write) is the route's.
@Injectable()
export class DocumentReviewService {
  constructor(
    private readonly uploads: DocumentUploadRepository,
    private readonly types: DocumentTypeRepository,
    private readonly registrations: RegistrationRepository,
    private readonly turnusy: TurnusRepository,
    private readonly files: FileService,
    private readonly campEmails: CampEmailService,
    private readonly audit: AuditService,
    private readonly jobs: JobQueue,
    private readonly clock: Clock,
  ) {}

  /**
   * Show each child's documents on a Registration, with links made in one query.
   * @param registrationId Registration id
   */
  public async ofRegistration(registrationId: string): Promise<RegistrationDocuments> {
    const registration = await this.registrations.getByIdOrThrow(registrationId);
    const turnus = await this.turnusy.getByIdOrThrow(registration.turnusId);
    const participants = await this.registrations.listParticipants(registration.id);
    const requirements = (await this.types.listByCamp(turnus.campId)).filter(({ kind }) => kind === 'requirement');
    const ids = participants.map(({ id }) => id);
    const uploads = await this.uploads.listOf(ids);
    const internal = await this.uploads.listInternalOf(ids);
    const fileIds = [
      ...uploads.flatMap(({ fileId }) => (fileId === null ? [] : [fileId])),
      ...internal.map(({ fileId }) => fileId),
    ];
    const links = await this.files.links(fileIds);
    const names = await this.files.names(internal.map(({ fileId }) => fileId));
    const uploadsOf = Map.groupBy(uploads, ({ participantId }) => participantId);
    const internalOf = Map.groupBy(internal, ({ participantId }) => participantId);

    return {
      requirements: requirements.map(({ id, name, dueDate }) => ({ id, name, dueDate })),
      participants: participants.map((participant) => ({
        id: participant.id,
        firstName: participant.firstName,
        lastName: participant.lastName,
        uploads: Object.fromEntries(
          [...Map.groupBy(uploadsOf.get(participant.id) ?? [], ({ documentTypeId }) => documentTypeId)].map(
            ([typeId, own]) => [typeId, own.map((upload) => shownUpload(upload, links))],
          ),
        ),
        internal: (internalOf.get(participant.id) ?? []).flatMap((document): InternalDocument[] => {
          const file = links.get(document.fileId);

          return file === undefined
            ? []
            : [
                {
                  id: document.id,
                  name: names.get(document.fileId) ?? '',
                  uploadedAt: document.uploadedAt.toISOString(),
                  file,
                },
              ];
        }),
      })),
    };
  }

  /**
   * Approve the newest document of a requirement while it waits, audited.
   * @param actor the admin
   * @param uploadId document id
   * @throws {ConflictException} document_review_stale when it is not the newest, or not pending
   */
  public async approve(actor: Actor, uploadId: string): Promise<AdminUpload> {
    const upload = await this.reviewable(uploadId);

    if (upload.status !== 'pending') {
      throw stale();
    }

    return this.review(actor, upload, { status: 'approved', note: null });
  }

  /**
   * Return the newest document of a requirement with a note, audited, and email both guardians.
   * @param actor the admin
   * @param uploadId document id
   * @param body the note
   * @throws {ConflictException} document_review_stale when it is not the newest, or already returned
   */
  public async returnUpload(actor: Actor, uploadId: string, body: ReturnDocumentBody): Promise<AdminUpload> {
    const upload = await this.reviewable(uploadId);

    if (upload.status === 'returned') {
      throw stale();
    }

    const returned = await this.review(actor, upload, { status: 'returned', note: body.note });
    const participant = await this.registrations.getParticipantOrThrow(upload.participantId);

    (await this.registrations.listGuardians(participant.registrationId)).forEach((_, index) =>
      this.jobs.enqueue(sendDocumentReturnedJob, { uploadId, guardian: index + 1 }),
    );

    return returned;
  }

  /**
   * Hand in a file for a child's requirement on the guardians' behalf, Approved at once, audited.
   * @param actor the admin
   * @param params the Registration, child and requirement
   * @param upload the file
   */
  public async uploadOnBehalf(actor: Actor, params: ChildRequirementParams, upload: FileUpload): Promise<AdminUpload> {
    const fileId = await this.files.store(upload);

    return this.handIn(actor, params, fileId);
  }

  /**
   * Mark a child's requirement handed in on paper, Approved without a file, audited.
   * @param actor the admin
   * @param params the Registration, child and requirement
   */
  public async markOnPaper(actor: Actor, params: ChildRequirementParams): Promise<AdminUpload> {
    return this.handIn(actor, params, null);
  }

  /**
   * Attach an Internal document to a child, audited.
   * @param actor the admin
   * @param params the Registration and child
   * @param upload the file
   */
  public async addInternal(actor: Actor, params: ChildParams, upload: FileUpload): Promise<InternalDocument> {
    // The Platform operator under a support grant acts under their own admin identity.
    if (actor.kind !== 'admin' && actor.kind !== 'operator') {
      throw new Error('Only an admin attaches an Internal document');
    }

    const fileId = await this.files.store(upload);
    const participant = await this.childOf(params.registrationId, params.participantId);
    const document = await this.uploads.addInternal({
      participantId: participant.id,
      fileId,
      uploadedByAdminId: actor.identity,
      uploadedAt: this.clock.now(),
    });

    await this.audit.record(actor, {
      action: 'internal_document.create',
      target: { type: 'participant', id: participant.id },
      change: { before: null, after: document },
    });

    return {
      id: document.id,
      name: upload.name,
      uploadedAt: document.uploadedAt.toISOString(),
      file: await this.files.link(fileId),
    };
  }

  /**
   * Remove an Internal document and its file, audited.
   * @param actor the admin
   * @param internalDocumentId Internal document id
   * @throws {NotFoundException} when the Organisation has no such Internal document
   */
  public async removeInternal(actor: Actor, internalDocumentId: string): Promise<void> {
    const removed = await this.uploads.removeInternal(internalDocumentId);

    if (removed === null) {
      throw new NotFoundException();
    }

    await this.files.remove(removed.fileId);
    await this.audit.record(actor, {
      action: 'internal_document.remove',
      target: { type: 'participant', id: removed.participantId },
      change: { before: removed, after: null },
    });
  }

  /**
   * Tell one guardian a document came back, with the Camp's wording, unless the Camp switched it off.
   * @param uploadId the returned document
   * @param guardian the guardian's position, 1 or 2
   */
  public async sendReturned(uploadId: string, guardian: number): Promise<void> {
    const upload = await this.uploads.lockById(uploadId);

    // A document handed in again or approved meanwhile is no news to send.
    if (upload === null || upload.status !== 'returned') {
      return;
    }

    const participant = await this.registrations.getParticipantOrThrow(upload.participantId);
    const recipient = (await this.registrations.listGuardians(participant.registrationId))[guardian - 1];
    const registration = await this.registrations.getByIdOrThrow(participant.registrationId);
    const turnus = await this.turnusy.getByIdOrThrow(registration.turnusId);

    if (recipient !== undefined) {
      await this.campEmails.send(turnus.campId, 'document_returned', {
        values: { deti: `${participant.firstName} ${participant.lastName}`, turnus: turnus.name },
        to: [recipient.email],
      });
    }
  }

  /**
   * Find a handed-in document an admin may review: the newest of its child's requirement, locked.
   * @param uploadId document id
   * @throws {NotFoundException} when the Organisation has no such document
   * @throws {ConflictException} document_review_stale when a newer one was handed in
   */
  private async reviewable(uploadId: string): Promise<DocumentUploadRow> {
    const upload = await this.uploads.lockById(uploadId);

    if (upload === null) {
      throw new NotFoundException();
    }

    // The child stays locked as for a guardian's upload, so none lands between this check and the review.
    await this.registrations.lockParticipantOrThrow(upload.participantId);
    const newest = await this.uploads.getNewest(upload.participantId, upload.documentTypeId);

    if (newest?.id !== upload.id) {
      throw stale();
    }

    return upload;
  }

  /**
   * Set a document's review, audited.
   * @param actor the admin
   * @param before the document as it is
   * @param review the new status and note
   */
  private async review(
    actor: Actor,
    before: DocumentUploadRow,
    review: { status: DocumentUploadRow['status']; note: string | null },
  ): Promise<AdminUpload> {
    const after = await this.uploads.review(before.id, review);

    await this.audit.record(actor, {
      action: `document_upload.${review.status === 'approved' ? 'approve' : 'return'}`,
      target: { type: 'participant', id: before.participantId },
      change: { before, after },
    });

    return shownUpload(after, await this.files.links(after.fileId === null ? [] : [after.fileId]));
  }

  /**
   * Hand in a requirement for a child as the admin, Approved at once, audited.
   * @param actor the admin
   * @param params the Registration, child and requirement
   * @param fileId the stored file, or null for paper
   * @throws {ConflictException} document_review_stale when the requirement is already approved
   */
  private async handIn(actor: Actor, params: ChildRequirementParams, fileId: string | null): Promise<AdminUpload> {
    if (actor.kind !== 'admin' && actor.kind !== 'operator') {
      throw new Error('Only an admin hands in on behalf of the guardians');
    }

    const participant = await this.childOf(params.registrationId, params.participantId);
    const registration = await this.registrations.getByIdOrThrow(params.registrationId);
    const turnus = await this.turnusy.getByIdOrThrow(registration.turnusId);
    const requirement = await this.types.lockOrThrow(turnus.campId, params.documentTypeId);

    if (requirement.kind !== 'requirement') {
      throw new NotFoundException();
    }

    await this.registrations.lockParticipantOrThrow(participant.id);

    // A second click from a page not yet refreshed adds nothing to an approved requirement.
    if ((await this.uploads.getNewest(participant.id, requirement.id))?.status === 'approved') {
      throw stale();
    }

    const created = await this.uploads.create({
      participantId: participant.id,
      documentTypeId: requirement.id,
      fileId,
      status: 'approved',
      uploadedByAdminId: actor.identity,
      uploadedAt: this.clock.now(),
    });

    await this.audit.record(actor, {
      action: fileId === null ? 'document_upload.paper' : 'document_upload.create',
      target: { type: 'participant', id: participant.id },
      change: { before: null, after: created },
    });

    return shownUpload(created, await this.files.links(fileId === null ? [] : [fileId]));
  }

  /**
   * Find a child of a Registration of the current Organisation.
   * @param registrationId Registration id
   * @param participantId Participant id
   * @throws {NotFoundException} when the Registration has no such child
   */
  private async childOf(registrationId: string, participantId: string): Promise<ParticipantEntity> {
    const participant = (await this.registrations.listParticipants(registrationId)).find(
      ({ id }) => id === participantId,
    );

    if (participant === undefined) {
      throw new NotFoundException();
    }

    return participant;
  }
}

/**
 * Show a handed-in document to an admin.
 * @param upload the document
 * @param links short-lived links by file id
 */
function shownUpload(upload: DocumentUploadRow, links: ReadonlyMap<string, AdminUpload['file'] & object>): AdminUpload {
  return {
    id: upload.id,
    status: upload.status,
    note: upload.note,
    uploadedAt: upload.uploadedAt.toISOString(),
    uploadedBy: upload.uploadedByEmail,
    byAdmin: upload.uploadedByAdminId !== null,
    file: upload.fileId === null ? null : (links.get(upload.fileId) ?? null),
  };
}
