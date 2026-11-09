import { Injectable, NotFoundException } from '@nestjs/common';

import { CAMP_PHOTO_CONTENT_TYPES, MAX_CAMP_PHOTO_BYTES, type CampPhoto } from '@repo/schema/camps';
import type { FileContentType } from '@repo/schema/files';

import type { Actor } from '../../../../core/audit/actor.ts';
import { AuditService } from '../../../../core/audit/audit.service.ts';
import type { FileUpload } from '../../../../core/files/file-upload.ts';
import { FileService, type StoreLimits } from '../../../../core/files/file.service.ts';
import type { CampEntity } from '../../../../repositories/camps/camp/camp.entity.ts';
import { CampRepository } from '../../../../repositories/camps/camp/camp.repository.ts';

// Often taken at camp, with where and by whom in its metadata, and shown to everyone.
const CAMP_PHOTO_LIMITS: StoreLimits = {
  allow: CAMP_PHOTO_CONTENT_TYPES,
  maxBytes: MAX_CAMP_PHOTO_BYTES,
  stripMetadata: true,
};

// A Camp's photo, published on its public pages. Permission (Camp settings) is the route's.
@Injectable()
export class CampPhotoService {
  constructor(
    private readonly camps: CampRepository,
    private readonly files: FileService,
    private readonly audit: AuditService,
  ) {}

  /**
   * Get a Camp's photo through a short-lived link.
   * @param campId Camp id
   */
  public async get(campId: string): Promise<CampPhoto> {
    return this.view(await this.camps.getByIdOrThrow(campId));
  }

  /**
   * Give a Camp a photo from an uploaded image, stored without its metadata, audited; a photo it had loses
   * its file.
   * @param actor who does it
   * @param campId Camp id
   * @param upload the image
   */
  public async set(actor: Actor, campId: string, upload: FileUpload): Promise<CampPhoto> {
    // Locked first: a Camp that is not there, or another Organisation's, is refused before a file is stored
    // for it, and a simultaneous change starts from this one's result.
    const before = await this.camps.getByIdForUpdateOrThrow(campId);
    const photoFileId = await this.files.store(upload, CAMP_PHOTO_LIMITS);

    return this.view(await this.change(actor, before, photoFileId));
  }

  /**
   * Remove a Camp's photo and its file, audited.
   * @param actor who does it
   * @param campId Camp id
   */
  public async remove(actor: Actor, campId: string): Promise<CampPhoto> {
    const before = await this.camps.getByIdForUpdateOrThrow(campId);

    return this.view(await this.change(actor, before, null));
  }

  /**
   * Read the photo of a Camp of the current Organisation, for its public pages. Any other file of the
   * Organisation is not found, however its id was learned.
   * @param fileId the photo's file id
   * @throws {NotFoundException} when the file is no current photo of the Organisation's Camps
   */
  public async readPublic(fileId: string): Promise<{ contentType: FileContentType; bytes: Buffer }> {
    if (!(await this.camps.hasPhoto(fileId))) {
      throw new NotFoundException();
    }

    const { contentType, bytes } = await this.files.read(fileId);

    return { contentType, bytes };
  }

  /**
   * Set or clear a locked Camp's photo and audit it; a photo it replaces or removes loses its file.
   * @param actor who does it
   * @param before the Camp, locked
   * @param photoFileId the new photo's file, null for none
   */
  private async change(actor: Actor, before: CampEntity, photoFileId: string | null): Promise<CampEntity> {
    const after = await this.camps.update(before.id, { photoFileId });

    if (before.photoFileId !== null) {
      await this.files.remove(before.photoFileId);
    }

    await this.audit.record(actor, {
      action: photoFileId === null ? 'camp_photo.remove' : 'camp_photo.update',
      target: { type: 'camp', id: before.id },
      change: { before, after },
    });

    return after;
  }

  /**
   * Show a Camp's photo through a short-lived link.
   * @param camp the Camp
   */
  private async view(camp: CampEntity): Promise<CampPhoto> {
    return { photo: camp.photoFileId === null ? null : await this.files.link(camp.photoFileId) };
  }
}
