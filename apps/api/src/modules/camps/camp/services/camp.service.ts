import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';

import {
  CAMP_MODULES,
  campSlugProblem,
  type CampModules,
  type CampPreview,
  type CampSlugErrorCode,
  type CreateCampBody,
  type PublicCamp,
  type PublicCampCard,
  type PublicTurnus,
  type UpdateCampBody,
} from '@repo/schema/camps';
import { slugify } from '@repo/schema/shared';

import type { Actor } from '../../../../core/audit/actor.ts';
import { AuditService } from '../../../../core/audit/audit.service.ts';
import { UnitOfWork } from '../../../../core/database/unit-of-work.ts';
import { FileService } from '../../../../core/files/file.service.ts';
import { publicCampPhotoUrl, type CampEntity } from '../../../../repositories/camps/camp/camp.entity.ts';
import { CampRepository, type UpdateCamp } from '../../../../repositories/camps/camp/camp.repository.ts';
import {
  publicLogoUrl,
  type OrganisationEntity,
} from '../../../../repositories/organisations/organisation/organisation.entity.ts';
import { OrganisationRepository } from '../../../../repositories/organisations/organisation/organisation.repository.ts';
import { PaymentGatewayAccountRepository } from '../../../../repositories/organisations/payment-gateway-account/payment-gateway-account.repository.ts';
import { UndeliverableEmailService } from '../../../emails/undeliverable-email/services/undeliverable-email.service.ts';
import { effectiveBranding } from '../../camp-branding/services/camp-branding.service.ts';
import { NO_TURNUSY, TurnusService } from '../../turnus/services/turnus.service.ts';
import { campContactOf } from '../camp-contact.ts';

// The slug of a name with nothing a slug can hold, or with a reserved one.
const FALLBACK_SLUG = 'tabor';

@Injectable()
export class CampService {
  constructor(
    private readonly undeliverable: UndeliverableEmailService,
    private readonly camps: CampRepository,
    private readonly organisations: OrganisationRepository,
    private readonly gatewayAccounts: PaymentGatewayAccountRepository,
    private readonly turnusy: TurnusService,
    private readonly files: FileService,
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
    return this.showPublic(await this.getBySlugOrThrow(slug));
  }

  /**
   * List the current Organisation's Camps by name as its landing page shows them, each summed up from its
   * Turnusy.
   */
  public async listPublic(): Promise<PublicCampCard[]> {
    const organisation = await this.organisations.getByIdOrThrow(this.unitOfWork.organisationId);
    const cardPayments = (await this.gatewayAccounts.get()) !== null;
    const summaries = await this.turnusy.summariseByCamp();

    return (await this.camps.list()).map((camp) => ({
      ...publicOf(camp, organisation, cardPayments),
      ...(summaries.get(camp.id) ?? NO_TURNUSY),
    }));
  }

  /**
   * List a Camp's Turnusy as its public page shows them, the Camp found by its slug or a former one.
   * @param slug the slug from the address
   */
  public async listPublicTurnusy(slug: string): Promise<PublicTurnus[]> {
    return this.turnusy.listPublic((await this.getBySlugOrThrow(slug)).id);
  }

  /**
   * Show a Camp's public page with its Turnusy for its Organisation's admins, before it goes live too.
   * @param id Camp id
   */
  public async preview(id: string): Promise<CampPreview> {
    const camp = await this.camps.getByIdOrThrow(id);
    const organisation = await this.organisations.getByIdOrThrow(this.unitOfWork.organisationId);
    const { logoFileId } = effectiveBranding(camp, organisation);
    // The public logo and photo addresses work only on the subdomain; the main host shows them through
    // short links.
    const logoUrl = logoFileId === null ? null : (await this.files.link(logoFileId)).url;
    const photoUrl = camp.photoFileId === null ? null : (await this.files.link(camp.photoFileId)).url;

    return {
      camp: { ...publicOf(camp, organisation, (await this.gatewayAccounts.get()) !== null), logoUrl, photoUrl },
      turnusy: await this.turnusy.listPublic(camp.id),
    };
  }

  /**
   * Show every Camp's public page with its Turnusy, by name, as the current Organisation's public pages
   * will once it is approved.
   */
  public async previewAll(): Promise<CampPreview[]> {
    const previews: CampPreview[] = [];

    // One Camp after another: the unit of work's transaction runs one query at a time anyway.
    for (const camp of await this.camps.list()) {
      previews.push(await this.preview(camp.id));
    }

    return previews;
  }

  /**
   * Get a Camp of the current Organisation by its slug or a former one.
   * @param slug the slug from the address
   * @throws {NotFoundException} when no Camp of the Organisation has or had the slug
   */
  private async getBySlugOrThrow(slug: string): Promise<CampEntity> {
    const camp = await this.camps.getBySlug(slug.toLowerCase());

    if (camp === null) {
      throw new NotFoundException();
    }

    return camp;
  }

  /**
   * Show a Camp as its public pages do, in its own or its Organisation's branding.
   * @param camp the Camp
   */
  private async showPublic(camp: CampEntity): Promise<PublicCamp> {
    const organisation = await this.organisations.getByIdOrThrow(this.unitOfWork.organisationId);

    return publicOf(camp, organisation, (await this.gatewayAccounts.get()) !== null);
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
   * Change a Camp of the current Organisation, audited; its description, which guardians read, under an
   * action of its own. A new slug is kept with the former ones, which go on leading to the Camp. Like
   * create, it claims the slug before writing the Camp, so the two never wait on each other in opposite
   * order.
   * @param actor who does it
   * @param id Camp id
   * @param body the fields to change
   * @throws {ConflictException} camp_slug_taken when another Camp of the Organisation has or had the slug
   */
  public async update(
    actor: Actor,
    id: string,
    { modules, description, ...fields }: UpdateCampBody,
  ): Promise<CampEntity> {
    const before = await this.camps.getByIdForUpdateOrThrow(id);

    if (fields.slug !== undefined && fields.slug !== before.slug && !(await this.camps.claimSlug(id, fields.slug))) {
      throw slugTaken();
    }

    const changes: UpdateCamp = {
      ...fields,
      ...(modules === undefined ? {} : { modules: switchedOn(modules) }),
      ...(description === undefined ? {} : { description }),
    };
    const after = await this.camps.update(id, changes);

    if (Object.keys(changes).some((field) => field !== 'description')) {
      await this.audit.record(actor, {
        action: 'camp.update',
        target: { type: 'camp', id },
        change: { before: withoutDescription(before), after: withoutDescription(after) },
      });
    }

    // The settings form sends the description with every save; only a change of it is worth an entry.
    if (after.description !== before.description) {
      await this.audit.record(actor, {
        action: 'camp_description.update',
        target: { type: 'camp', id },
        change: { before: { description: before.description }, after: { description: after.description } },
      });
    }

    // A team address just given, such as one corrected after a bounce, starts without a mark.
    for (const email of after.notificationEmails.filter((email) => !before.notificationEmails.includes(email))) {
      await this.undeliverable.clear(actor, email.toLowerCase());
    }

    return after;
  }
}

/**
 * Show a Camp as its public pages do, in its own or its Organisation's branding.
 * @param camp the Camp
 * @param organisation its Organisation
 * @param cardPayments whether the Organisation takes card payments
 */
function publicOf(camp: CampEntity, organisation: OrganisationEntity, cardPayments: boolean): PublicCamp {
  const { accentColour, logoFileId } = effectiveBranding(camp, organisation);

  return camp.toPublicDto(
    {
      accentColour,
      logoUrl: logoFileId === null ? null : publicLogoUrl(logoFileId),
      photoUrl: camp.photoFileId === null ? null : publicCampPhotoUrl(camp.photoFileId),
    },
    campContactOf(camp, organisation),
    cardPayments,
  );
}

/**
 * Leave a Camp's description out of its row, as it is audited under an action of its own.
 * @param camp the Camp
 */
function withoutDescription({ description: _description, ...rest }: CampEntity) {
  return rest;
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
