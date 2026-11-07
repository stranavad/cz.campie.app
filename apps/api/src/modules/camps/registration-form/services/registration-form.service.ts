import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';

import {
  DEFAULT_MAX_PARTICIPANTS,
  REGISTRATION_FIELD_CATALOGUE,
  type RegistrationForm,
  type RegistrationFormErrorCode,
  type RegistrationFormVersion,
  type SaveRegistrationFormDraftBody,
} from '@repo/schema/camps';
import { diffVersions, formDefinitionSchema, type FormDefinition } from '@repo/schema/form-engine';

import type { Actor } from '../../../../core/audit/actor.ts';
import { AuditService } from '../../../../core/audit/audit.service.ts';
import { UnitOfWork } from '../../../../core/database/unit-of-work.ts';
import { Clock } from '../../../../core/ports/clock/clock.port.ts';
import { CampRepository } from '../../../../repositories/camps/camp/camp.repository.ts';
import { RegistrationFormDraftEntity } from '../../../../repositories/camps/registration-form/registration-form.entity.ts';
import { RegistrationFormRepository } from '../../../../repositories/camps/registration-form/registration-form.repository.ts';
import { OrganisationRepository } from '../../../../repositories/organisations/organisation/organisation.repository.ts';

// The form a new Camp starts with: the locked core alone, ready to publish as it is.
const PRESET: FormDefinition = { standard: [], custom: [] };

// The registration forms of the current Organisation's Camps: a draft each, and published versions that
// never change. Permission (Camp settings) is the route's.
@Injectable()
export class RegistrationFormService {
  constructor(
    private readonly forms: RegistrationFormRepository,
    private readonly camps: CampRepository,
    private readonly organisations: OrganisationRepository,
    private readonly audit: AuditService,
    private readonly unitOfWork: UnitOfWork,
    private readonly clock: Clock,
  ) {}

  /**
   * Get a Camp's form for the builder: its draft, the preset one when it never saved one, and its latest
   * published version.
   * @param campId Camp id
   */
  public async get(campId: string): Promise<RegistrationForm> {
    await this.camps.getByIdOrThrow(campId);
    const draft = (await this.forms.getDraft(campId)) ?? presetDraft(campId);

    return draft.toDto(await this.forms.getLatestVersion(campId));
  }

  /**
   * Replace a Camp's draft, audited; the published version stays what guardians see.
   * @param actor who does it
   * @param campId Camp id
   * @param body the draft and the most children per Registration
   */
  public async saveDraft(actor: Actor, campId: string, body: SaveRegistrationFormDraftBody): Promise<RegistrationForm> {
    await this.camps.getByIdOrThrow(campId);
    const before = (await this.forms.getDraft(campId)) ?? presetDraft(campId);
    const after = await this.forms.saveDraft(campId, { draft: body.definition, maxParticipants: body.maxParticipants });

    await this.audit.record(actor, {
      action: 'registration_form.update',
      target: { type: 'registration_form', id: campId },
      change: { before, after },
    });

    return after.toDto(await this.forms.getLatestVersion(campId));
  }

  /**
   * Publish a Camp's draft as its next version, audited. Publishes of one Camp run one after another, so
   * no two get the same number.
   * @param actor who does it
   * @param campId Camp id
   * @throws {ConflictException} form_field_changed when a custom field has another type or scope than in
   * any earlier version; form_definition_invalid when the draft no longer holds together, as when the
   * platform's standard fields changed since it was saved
   */
  public async publish(actor: Actor, campId: string): Promise<RegistrationFormVersion> {
    await this.camps.getByIdOrThrow(campId);
    const { draft, maxParticipants } = await this.forms.lockDraft(campId, {
      draft: PRESET,
      maxParticipants: DEFAULT_MAX_PARTICIPANTS,
    });
    const latest = await this.forms.getLatestVersion(campId);

    if (!formDefinitionSchema(REGISTRATION_FIELD_CATALOGUE).safeParse(draft).success) {
      throw publishRefused('form_definition_invalid');
    }

    // A field removed and added back under its id must also keep what it was, or old answers misfit it.
    if ((await this.forms.listDefinitions(campId)).some((earlier) => diffVersions(earlier, draft).changed.length > 0)) {
      throw publishRefused('form_field_changed');
    }

    const version = await this.forms.createVersion(campId, {
      version: (latest?.version ?? 0) + 1,
      definition: draft,
      maxParticipants,
      publishedAt: this.clock.now(),
    });

    await this.audit.record(actor, {
      action: 'registration_form_version.create',
      target: { type: 'registration_form_version', id: version.id },
      change: { before: null, after: { campId, version: version.version, maxParticipants } },
    });

    return version.toDto();
  }

  /**
   * Get one published version of a Camp's form, as it was.
   * @param campId Camp id
   * @param version the version's number
   */
  public async getVersion(campId: string, version: number): Promise<RegistrationFormVersion> {
    await this.camps.getByIdOrThrow(campId);

    return (await this.forms.getVersionOrThrow(campId, version)).toDto();
  }

  /**
   * Get the latest published form of a Camp of the current Organisation, by its slug or a former one, as
   * guardians fill it in.
   * @param slug the slug from the address
   * @throws {NotFoundException} when the Camp is unknown, has published nothing yet, or the Organisation
   * is not approved
   */
  public async getPublic(slug: string): Promise<RegistrationFormVersion> {
    const organisation = await this.organisations.getByIdOrThrow(this.unitOfWork.organisationId);
    const camp = organisation.status === 'approved' ? await this.camps.getBySlug(slug.toLowerCase()) : null;
    const latest = camp === null ? null : await this.forms.getLatestVersion(camp.id);

    if (latest === null) {
      throw new NotFoundException();
    }

    return latest.toDto();
  }
}

function publishRefused(code: RegistrationFormErrorCode): ConflictException {
  return new ConflictException({ code, message: `Publish refused: ${code}` });
}

function presetDraft(campId: string): RegistrationFormDraftEntity {
  return new RegistrationFormDraftEntity({ campId, draft: PRESET, maxParticipants: DEFAULT_MAX_PARTICIPANTS });
}
