import { Injectable } from '@nestjs/common';

import type { CampBranding, UpdateCampBrandingBody } from '@repo/schema/camps';

import type { Actor } from '../../../../core/audit/actor.ts';
import { AuditService } from '../../../../core/audit/audit.service.ts';
import { UnitOfWork } from '../../../../core/database/unit-of-work.ts';
import type { FileUpload } from '../../../../core/files/file-upload.ts';
import { FileService, LOGO_LIMITS } from '../../../../core/files/file.service.ts';
import type { CampEntity } from '../../../../repositories/camps/camp/camp.entity.ts';
import { CampRepository, type UpdateCamp } from '../../../../repositories/camps/camp/camp.repository.ts';
import type { OrganisationEntity } from '../../../../repositories/organisations/organisation/organisation.entity.ts';
import { OrganisationRepository } from '../../../../repositories/organisations/organisation/organisation.repository.ts';

// The branding a Camp's pages, emails and documents show.
export interface EffectiveBranding {
  readonly accentColour: string;
  readonly logoFileId: string | null;
}

/**
 * Resolve the branding a Camp shows: its own accent colour and logo, each falling back to its
 * Organisation's.
 * @param camp the Camp
 * @param organisation the Camp's Organisation
 */
export function effectiveBranding(camp: CampEntity, organisation: OrganisationEntity): EffectiveBranding {
  return {
    accentColour: camp.accentColour ?? organisation.accentColour,
    logoFileId: camp.logoFileId ?? organisation.logoFileId,
  };
}

// A Camp's own branding over its Organisation's. Permission (Camp settings) is the route's.
@Injectable()
export class CampBrandingService {
  constructor(
    private readonly camps: CampRepository,
    private readonly organisations: OrganisationRepository,
    private readonly files: FileService,
    private readonly audit: AuditService,
    private readonly unitOfWork: UnitOfWork,
  ) {}

  /**
   * Get a Camp's own branding and the branding it shows.
   * @param campId Camp id
   */
  public async get(campId: string): Promise<CampBranding> {
    return this.view(await this.camps.getByIdOrThrow(campId));
  }

  /**
   * Set or clear a Camp's own accent colour, audited.
   * @param actor who does it
   * @param campId Camp id
   * @param body the colour, null for the Organisation's
   */
  public async update(actor: Actor, campId: string, { accentColour }: UpdateCampBrandingBody): Promise<CampBranding> {
    return this.view(await this.change(actor, campId, { accentColour }));
  }

  /**
   * Give a Camp its own logo from an uploaded image; a logo it had loses its file.
   * @param actor who does it
   * @param campId Camp id
   * @param upload the image
   */
  public async setLogo(actor: Actor, campId: string, upload: FileUpload): Promise<CampBranding> {
    // A Camp that is not there, or another Organisation's, is refused before a file is stored for it.
    await this.camps.getByIdForUpdateOrThrow(campId);
    const logoFileId = await this.files.store(upload, LOGO_LIMITS);

    return this.view(await this.change(actor, campId, { logoFileId }));
  }

  /**
   * Return a Camp to its Organisation's logo, removing its own logo's file.
   * @param actor who does it
   * @param campId Camp id
   */
  public async removeLogo(actor: Actor, campId: string): Promise<CampBranding> {
    return this.view(await this.change(actor, campId, { logoFileId: null }));
  }

  /**
   * Change a Camp's branding, locked so a simultaneous change starts from this one's result, and audit it;
   * a logo it replaces or removes loses its file.
   * @param actor who does it
   * @param campId Camp id
   * @param changes the fields to change
   */
  private async change(actor: Actor, campId: string, changes: UpdateCamp): Promise<CampEntity> {
    const before = await this.camps.getByIdForUpdateOrThrow(campId);
    const after = await this.camps.update(campId, changes);

    if (before.logoFileId !== null && before.logoFileId !== after.logoFileId) {
      await this.files.remove(before.logoFileId);
    }

    await this.audit.record(actor, {
      action: 'camp.update',
      target: { type: 'camp', id: campId },
      change: { before, after },
    });

    return after;
  }

  /**
   * Show a Camp's branding with short-lived links to its own logo and the one it shows.
   * @param camp the Camp
   */
  private async view(camp: CampEntity): Promise<CampBranding> {
    const organisation = await this.organisations.getByIdOrThrow(this.unitOfWork.organisationId);
    const effective = effectiveBranding(camp, organisation);
    const ownLogo = camp.logoFileId === null ? null : await this.files.link(camp.logoFileId);
    const shownLogo =
      effective.logoFileId === camp.logoFileId || effective.logoFileId === null
        ? ownLogo
        : await this.files.link(effective.logoFileId);

    return camp.toBrandingDto(ownLogo, { accentColour: effective.accentColour, logo: shownLogo });
  }
}
