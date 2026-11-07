import { Injectable, NotFoundException } from '@nestjs/common';

import type { FileLink } from '@repo/schema/files';
import type { UpdateOrganisationSettingsBody } from '@repo/schema/organisations';

import type { Actor } from '../../../../core/audit/actor.ts';
import { AuditService } from '../../../../core/audit/audit.service.ts';
import { UnitOfWork } from '../../../../core/database/unit-of-work.ts';
import type { FileUpload } from '../../../../core/files/file-upload.ts';
import { FileService, LOGO_LIMITS } from '../../../../core/files/file.service.ts';
import type { OrganisationEntity } from '../../../../repositories/organisations/organisation/organisation.entity.ts';
import {
  OrganisationRepository,
  type UpdateOrganisation,
} from '../../../../repositories/organisations/organisation/organisation.repository.ts';

// An Organisation as its settings show it: with a short-lived link to its logo.
export interface OrganisationSettingsView {
  readonly organisation: OrganisationEntity;
  readonly logo: FileLink | null;
}

// The current Organisation's settings, as its Owners keep them. Permission (Owners only) is the route's.
@Injectable()
export class OrganisationSettingsService {
  constructor(
    private readonly organisations: OrganisationRepository,
    private readonly files: FileService,
    private readonly audit: AuditService,
    private readonly unitOfWork: UnitOfWork,
  ) {}

  /**
   * Get the current Organisation with a link to its logo.
   */
  public async get(): Promise<OrganisationSettingsView> {
    return this.withLogo(await this.organisations.getByIdOrThrow(this.unitOfWork.organisationId));
  }

  /**
   * Change the current Organisation's settings, audited with old and new values.
   * @param actor who does it
   * @param changes the fields to change
   */
  public async update(actor: Actor, changes: UpdateOrganisationSettingsBody): Promise<OrganisationSettingsView> {
    return this.withLogo(await this.change(actor, changes));
  }

  /**
   * Replace the current Organisation's logo by an uploaded image; the old one's file is removed.
   * @param actor who does it
   * @param upload the image
   */
  public async setLogo(actor: Actor, upload: FileUpload): Promise<OrganisationSettingsView> {
    const logoFileId = await this.files.store(upload, LOGO_LIMITS);

    return this.withLogo(await this.change(actor, { logoFileId }));
  }

  /**
   * Remove the current Organisation's logo and its file.
   * @param actor who does it
   */
  public async removeLogo(actor: Actor): Promise<OrganisationSettingsView> {
    return this.withLogo(await this.change(actor, { logoFileId: null }));
  }

  /**
   * Change the current Organisation, locked so a simultaneous change starts from this one's result, and
   * audit it; a logo it replaces or removes loses its file.
   * @param actor who does it
   * @param changes the fields to change
   * @throws {NotFoundException} when the current Organisation is gone
   */
  private async change(actor: Actor, changes: UpdateOrganisation): Promise<OrganisationEntity> {
    const before = await this.organisations.getByIdForUpdate(this.unitOfWork.organisationId);

    if (before === null) {
      throw new NotFoundException();
    }

    const after = await this.organisations.update(before.id, changes);

    if (before.logoFileId !== null && before.logoFileId !== after.logoFileId) {
      await this.files.remove(before.logoFileId);
    }

    await this.audit.record(actor, {
      action: 'organisation.update',
      target: { type: 'organisation', id: after.id },
      change: { before, after },
    });

    return after;
  }

  /**
   * Pair an Organisation with a short-lived link to its logo, for its Owners to see.
   * @param organisation the Organisation
   */
  private async withLogo(organisation: OrganisationEntity): Promise<OrganisationSettingsView> {
    return {
      organisation,
      logo: organisation.logoFileId === null ? null : await this.files.link(organisation.logoFileId),
    };
  }
}
