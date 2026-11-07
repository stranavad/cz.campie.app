import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';

import {
  CAMP_MODULES,
  campSlugProblem,
  type CampModules,
  type CampSlugErrorCode,
  type CreateCampBody,
  type PublicCamp,
  type UpdateCampBody,
} from '@repo/schema/camps';
import { slugify } from '@repo/schema/shared';

import type { Actor } from '../../../../core/audit/actor.ts';
import { AuditService } from '../../../../core/audit/audit.service.ts';
import { UnitOfWork } from '../../../../core/database/unit-of-work.ts';
import type { CampEntity } from '../../../../repositories/camps/camp/camp.entity.ts';
import { CampRepository, type UpdateCamp } from '../../../../repositories/camps/camp/camp.repository.ts';
import { publicLogoUrl } from '../../../../repositories/organisations/organisation/organisation.entity.ts';
import { OrganisationRepository } from '../../../../repositories/organisations/organisation/organisation.repository.ts';
import { effectiveBranding } from '../../camp-branding/services/camp-branding.service.ts';

// The slug of a name with nothing a slug can hold, or with a reserved one.
const FALLBACK_SLUG = 'tabor';

@Injectable()
export class CampService {
  constructor(
    private readonly camps: CampRepository,
    private readonly organisations: OrganisationRepository,
    private readonly audit: AuditService,
    private readonly unitOfWork: UnitOfWork,
  ) {}

  /**
   * List the current Organisation's Camps by name.
   */
  public list(): Promise<CampEntity[]> {
    return this.camps.list();
  }

  /**
   * Get a Camp of the current Organisation by id, or throw if missing.
   * @param id Camp id
   */
  public getByIdOrThrow(id: string): Promise<CampEntity> {
    return this.camps.getByIdOrThrow(id);
  }

  /**
   * Get a Camp of the current Organisation by its slug or a former one, as its public pages show it.
   * @param slug the slug from the address
   * @throws {NotFoundException} when no Camp of the Organisation has or had the slug
   */
  public async getPublic(slug: string): Promise<PublicCamp> {
    const camp = await this.camps.getBySlug(slug.toLowerCase());

    if (camp === null) {
      throw new NotFoundException();
    }

    const organisation = await this.organisations.getByIdOrThrow(this.unitOfWork.organisationId);
    const { accentColour, logoFileId } = effectiveBranding(camp, organisation);

    return camp.toPublicDto({ accentColour, logoUrl: logoFileId === null ? null : publicLogoUrl(logoFileId) });
  }

  /**
   * Create the first Camp of the current Organisation, its slug taken from its name, audited.
   * @param actor who does it
   * @param input the Camp's name
   */
  public async createFirst(actor: Actor, { name }: { name: string }): Promise<CampEntity> {
    const fromName = slugify(name);

    return this.create(actor, {
      name,
      slug: fromName === '' || campSlugProblem(fromName) !== null ? FALLBACK_SLUG : fromName,
      websiteUrl: null,
      contactName: null,
      contactEmail: null,
      contactPhone: null,
    });
  }

  /**
   * Create a Camp in the current Organisation, every module off, audited.
   * @param actor who does it
   * @param body the Camp
   * @throws {ConflictException} camp_slug_taken when a Camp of the Organisation has or had the slug
   */
  public async create(actor: Actor, body: CreateCampBody): Promise<CampEntity> {
    const camp = await this.camps.create(body);

    // The claim rolls the Camp back with the unit of work when it fails.
    if (!(await this.camps.claimSlug(camp.id, camp.slug))) {
      throw slugTaken();
    }

    await this.audit.record(actor, {
      action: 'camp.create',
      target: { type: 'camp', id: camp.id },
      change: { before: null, after: camp },
    });

    return camp;
  }

  /**
   * Change a Camp of the current Organisation, audited. A new slug is kept with the former ones, which go
   * on leading to the Camp. Like create, it claims the slug before writing the Camp, so the two never wait
   * on each other in opposite order.
   * @param actor who does it
   * @param id Camp id
   * @param body the fields to change
   * @throws {ConflictException} camp_slug_taken when another Camp of the Organisation has or had the slug
   */
  public async update(actor: Actor, id: string, { modules, ...fields }: UpdateCampBody): Promise<CampEntity> {
    const before = await this.camps.getByIdForUpdateOrThrow(id);

    if (fields.slug !== undefined && fields.slug !== before.slug && !(await this.camps.claimSlug(id, fields.slug))) {
      throw slugTaken();
    }

    const changes: UpdateCamp = modules === undefined ? fields : { ...fields, modules: switchedOn(modules) };
    const after = await this.camps.update(id, changes);

    await this.audit.record(actor, {
      action: 'camp.update',
      target: { type: 'camp', id },
      change: { before, after },
    });

    return after;
  }
}

/**
 * List the modules a set of switches turns on, in their fixed order.
 * @param modules a switch per module
 */
function switchedOn(modules: CampModules): (typeof CAMP_MODULES)[number][] {
  return CAMP_MODULES.filter((module) => modules[module]);
}

function slugTaken(): ConflictException {
  const code: CampSlugErrorCode = 'camp_slug_taken';

  return new ConflictException({ code, message: 'The slug belongs to another Camp' });
}
