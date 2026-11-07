import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { GuardianDocuments, GuardianUpload, UploadDocumentParams, UploadErrorCode } from '@repo/schema/documents';

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
import { DocumentUploadRepository } from '../../../../repositories/documents/document-upload/document-upload.repository.ts';
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
    const { camp, participants } = await this.familyOf(actor.identity, params.registrationId);
    const participant = participants.find(({ id }) => id === params.participantId);

    if (!camp.modules.includes('documents') || participant === undefined) {
      throw new NotFoundException();
    }

    // Checked once before the file is stored, so a refused upload costs no storage, and again under the
    // locks below.
    this.refuseUnneeded(await this.uploads.getNewest(participant.id, params.documentTypeId));

    // Stored before the locks, so they are held only for the checks; a refusal rolls the object back.
    const fileId = await this.files.store(upload);
    // The requirement and the child stay locked: the requirement is not removed meanwhile, the child not
    // cancelled, and two uploads at once never both pass the check below.
    const requirement = await this.types.lockOrThrow(camp.id, params.documentTypeId);
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
