import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type {
  GuardianDocuments,
  GuardianUpload,
  ReplaceUploadParams,
  UploadDocumentParams,
  UploadErrorCode,
} from '@repo/schema/documents';

import type { Actor } from '../../../../core/audit/actor.ts';
import { AuditService } from '../../../../core/audit/audit.service.ts';
import type { Env } from '../../../../core/config/env.schema.ts';
import type { FileUpload } from '../../../../core/files/file-upload.ts';
import { FileService } from '../../../../core/files/file.service.ts';
import { Clock } from '../../../../core/ports/clock/clock.port.ts';
import { RateLimiter, type RequestLimit } from '../../../../core/rate-limits/rate-limiter.ts';
import type { CampEntity } from '../../../../repositories/camps/camp/camp.entity.ts';
import { CampRepository } from '../../../../repositories/camps/camp/camp.repository.ts';
import type { TurnusEntity } from '../../../../repositories/camps/turnus/turnus.entity.ts';
import { TurnusRepository } from '../../../../repositories/camps/turnus/turnus.repository.ts';
import { DocumentTypeRepository } from '../../../../repositories/documents/document-type/document-type.repository.ts';
import {
  DocumentUploadRepository,
  type DocumentUploadRow,
} from '../../../../repositories/documents/document-upload/document-upload.repository.ts';
import type { ParticipantEntity } from '../../../../repositories/registrations/participant/participant.entity.ts';
import { RegistrationRepository } from '../../../../repositories/registrations/registration/registration.repository.ts';

interface Family {
  readonly camp: CampEntity;
  readonly turnus: TurnusEntity;
  readonly participants: readonly ParticipantEntity[];
}

// The documents of a guardian's Registration: the Camp's downloads for its Turnus, its requirements, and
// what each Registered child handed in. Guardians and access emails of the Registration alike, while the
// Camp's Documents module is on.
@Injectable()
export class GuardianDocumentService {
  private readonly limit: RequestLimit;

  constructor(
    private readonly types: DocumentTypeRepository,
    private readonly uploads: DocumentUploadRepository,
    private readonly registrations: RegistrationRepository,
    private readonly turnusy: TurnusRepository,
    private readonly camps: CampRepository,
    private readonly files: FileService,
    private readonly audit: AuditService,
    private readonly clock: Clock,
    private readonly rateLimiter: RateLimiter,
    config: ConfigService<Env, true>,
  ) {
    this.limit = config.get('requestLimits', { infer: true }).guardianAction;
  }

  /**
   * List the documents of a guardian's Registration.
   * @param email the signed-in guardian's email
   * @param registrationId Registration id
   */
  public async list(email: string, registrationId: string): Promise<GuardianDocuments> {
    const { camp, turnus, participants } = await this.familyOf(email, registrationId);

    if (!camp.modules.includes('documents')) {
      return { downloads: [], requirements: [], participants: [] };
    }

    const types = await this.types.listByCamp(camp.id);
    const downloads = types.flatMap(({ id, kind, name, description, fileId, turnusIds }) =>
      kind === 'download' && fileId !== null && (turnusIds.length === 0 || turnusIds.includes(turnus.id))
        ? [{ id, name, description, fileId }]
        : [],
    );
    const requirements = types.filter(({ kind }) => kind === 'requirement');

    const handedIn = (await this.uploads.listOf(participants.map(({ id }) => id))).filter(({ documentTypeId }) =>
      requirements.some(({ id }) => id === documentTypeId),
    );
    const links = await this.files.links([
      ...downloads.map(({ fileId }) => fileId),
      ...requirements.flatMap(({ fileId }) => (fileId === null ? [] : [fileId])),
      ...handedIn.flatMap(({ fileId }) => (fileId === null ? [] : [fileId])),
    ]);
    const linkOf = (fileId: string | null) => (fileId === null ? null : (links.get(fileId) ?? null));
    const byChild = Map.groupBy(handedIn, ({ participantId }) => participantId);

    return {
      downloads: downloads.flatMap(({ fileId, ...download }) => {
        const file = linkOf(fileId);

        return file === null ? [] : [{ ...download, file }];
      }),
      requirements: requirements.map(({ id, name, description, dueDate, fileId }) => ({
        id,
        name,
        description,
        dueDate,
        blankForm: linkOf(fileId),
      })),
      participants: participants.map((participant) => ({
        id: participant.id,
        firstName: participant.firstName,
        lastName: participant.lastName,
        uploads: Object.fromEntries(
          [...Map.groupBy(byChild.get(participant.id) ?? [], ({ documentTypeId }) => documentTypeId)].map(
            ([typeId, own]) => [
              typeId,
              own.map((upload): GuardianUpload => ({
                id: upload.id,
                status: upload.status,
                note: upload.note,
                uploadedAt: upload.uploadedAt.toISOString(),
                file: linkOf(upload.fileId),
              })),
            ],
          ),
        ),
      })),
    };
  }

  /**
   * Hand in a PDF, JPG or PNG for a child's requirement, stored encrypted and Pending, audited. Only a
   * requirement with nothing handed in, or whose newest document was returned, takes one.
   * @param actor the guardian
   * @param params the Registration, Participant and requirement
   * @param upload the file
   * @throws {NotFoundException} when the child or requirement is not the guardian's
   * @throws {ConflictException} document_upload_not_needed when the newest document waits or was approved
   */
  public async upload(actor: Actor, params: UploadDocumentParams, upload: FileUpload): Promise<GuardianDocuments> {
    if (actor.kind !== 'guardian') {
      throw new Error('Only a guardian hands in a document');
    }

    await this.rateLimiter.admit(this.limit, { ipAddress: actor.ipAddress, target: actor.identity });
    const { participant } = await this.childOf(actor.identity, params);

    // Checked once before the file is stored, so a refused upload costs no storage, and again under the
    // locks below.
    this.refuseUnneeded(await this.uploads.getNewest(participant.id, params.documentTypeId));

    // Stored before the locks, so they are held only for the checks; a refusal rolls the object back.
    const fileId = await this.files.store(upload);
    // The Registration's lock keeps an erasure out until the document commits; after one, the family is gone,
    // so the child is looked up again under it.
    await this.registrations.lockById(params.registrationId);
    const { camp } = await this.childOf(actor.identity, params);
    // The requirement is held and the child locked: the requirement is not changed or removed meanwhile,
    // the child not cancelled, and two uploads for the child at once never both pass the check below.
    const requirement = await this.types.holdOrThrow(camp.id, params.documentTypeId);
    const locked = await this.registrations.lockParticipantOrThrow(participant.id);

    if (requirement.kind !== 'requirement' || locked.status !== 'registered') {
      throw new NotFoundException();
    }

    this.refuseUnneeded(await this.uploads.getNewest(participant.id, requirement.id));

    const created = await this.uploads.create({
      participantId: participant.id,
      documentTypeId: requirement.id,
      fileId,
      uploadedByEmail: actor.identity,
      uploadedAt: this.clock.now(),
    });

    await this.audit.record(actor, {
      action: 'document_upload.create',
      target: { type: 'participant', id: participant.id },
      change: { before: null, after: created },
    });

    return this.list(actor.identity, params.registrationId);
  }

  /**
   * Replace the file of a document still waiting for review, such as a wrong photo: the document keeps its
   * place, takes the new file, guardian and instant, and the old file is deleted. Audited.
   * @param actor the guardian
   * @param params the Registration and the document
   * @param upload the new file
   * @throws {NotFoundException} when the document is not of a Registered child of the guardian's Registration
   * @throws {ConflictException} document_upload_not_pending when it was reviewed already
   */
  public async replace(actor: Actor, params: ReplaceUploadParams, upload: FileUpload): Promise<GuardianDocuments> {
    if (actor.kind !== 'guardian') {
      throw new Error('Only a guardian replaces a document');
    }

    await this.rateLimiter.admit(this.limit, { ipAddress: actor.ipAddress, target: actor.identity });
    // Checked once before the file is stored, so a refused replacement costs no storage, and again under
    // the locks below.
    this.refuseUnreplaceable(await this.replaceableOf(actor.identity, params, null));

    const fileId = await this.files.store(upload);
    // The same order as an upload's and a review's: the Registration (keeping an erasure out), then the
    // document before its child, so a review deciding on it meanwhile is seen below.
    await this.registrations.lockById(params.registrationId);
    const before = await this.replaceableOf(actor.identity, params, await this.uploads.lockById(params.uploadId));
    this.refuseUnreplaceable(before);
    await this.registrations.lockParticipantOrThrow(before.participantId);

    const after = await this.uploads.replaceFile(before.id, {
      fileId,
      uploadedByEmail: actor.identity,
      uploadedAt: this.clock.now(),
    });

    if (before.fileId !== null) {
      await this.files.remove(before.fileId);
    }

    await this.audit.record(actor, {
      action: 'document_upload.replace',
      target: { type: 'participant', id: before.participantId },
      change: { before, after },
    });

    return this.list(actor.identity, params.registrationId);
  }

  /**
   * Find a document of a Registered child of the guardian's Registration, in a Camp that takes documents.
   * @param email the guardian's email
   * @param params the Registration and the document
   * @param locked the document as locked, or null to read it now
   * @throws {NotFoundException} when the document is not of the guardian's Registered child
   */
  private async replaceableOf(
    email: string,
    params: ReplaceUploadParams,
    locked: DocumentUploadRow | null,
  ): Promise<DocumentUploadRow> {
    const document = locked ?? (await this.uploads.getById(params.uploadId));
    const { camp, participants } = await this.familyOf(email, params.registrationId);

    if (
      document === null ||
      !camp.modules.includes('documents') ||
      !participants.some(({ id }) => id === document.participantId)
    ) {
      throw new NotFoundException();
    }

    return document;
  }

  /**
   * Refuse to replace a document that was reviewed, or one handed in on paper.
   * @param document the document
   * @throws {ConflictException} document_upload_not_pending
   */
  private refuseUnreplaceable(document: DocumentUploadRow): void {
    if (document.status !== 'pending' || document.fileId === null) {
      const code: UploadErrorCode = 'document_upload_not_pending';

      throw new ConflictException({ code, message: 'The document was reviewed already' });
    }
  }

  /**
   * Find the guardian's Registered child an upload is for, in a Camp that takes documents.
   * @param email the guardian's email
   * @param params the Registration and Participant
   * @throws {NotFoundException} when the child is not the guardian's or the Camp takes no documents
   */
  private async childOf(
    email: string,
    params: UploadDocumentParams,
  ): Promise<{ camp: { id: string }; participant: { id: string } }> {
    const { camp, participants } = await this.familyOf(email, params.registrationId);
    const participant = participants.find(({ id }) => id === params.participantId);

    if (!camp.modules.includes('documents') || participant === undefined) {
      throw new NotFoundException();
    }

    return { camp, participant };
  }

  /**
   * Find the Camp, Turnus and Registered children of a guardian's Registration.
   * @param email the guardian's email
   * @param registrationId Registration id
   * @throws {NotFoundException} when the guardian has no access to the Registration
   */
  private async familyOf(email: string, registrationId: string): Promise<Family> {
    const registration = await this.registrations.getByGuardian(email, registrationId);

    if (registration === null) {
      throw new NotFoundException();
    }

    const turnus = await this.turnusy.getByIdOrThrow(registration.turnusId);

    return {
      camp: await this.camps.getByIdOrThrow(turnus.campId),
      turnus,
      participants: (await this.registrations.listParticipants(registration.id)).filter(
        ({ status }) => status === 'registered',
      ),
    };
  }

  /**
   * Refuse a document for a requirement whose newest one waits for review or was approved.
   * @param newest the newest document handed in, or null
   * @throws {ConflictException} document_upload_not_needed
   */
  private refuseUnneeded(newest: { status: string } | null): void {
    if (newest !== null && newest.status !== 'returned') {
      const code: UploadErrorCode = 'document_upload_not_needed';

      throw new ConflictException({ code, message: 'The requirement takes no document now' });
    }
  }
}
