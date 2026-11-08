import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';

import {
  DEFAULT_MAX_PARTICIPANTS,
  REGISTRATION_FIELD_CATALOGUE,
  type Declaration,
  type RegistrationForm,
  type RegistrationFormErrorCode,
  type RegistrationFormVersion,
  type SaveRegistrationFormDraftBody,
  type ShownDeclaration,
  type UploadedDeclarationFile,
} from '@repo/schema/camps';
import { diffVersions, formDefinitionSchema, type FormDefinition } from '@repo/schema/form-engine';

import type { Actor } from '../../../../core/audit/actor.ts';
import { AuditService } from '../../../../core/audit/audit.service.ts';
import type { FileUpload } from '../../../../core/files/file-upload.ts';
import { FileService } from '../../../../core/files/file.service.ts';
import { Clock } from '../../../../core/ports/clock/clock.port.ts';
import { CampRepository } from '../../../../repositories/camps/camp/camp.repository.ts';
import { RegistrationFormDraftEntity } from '../../../../repositories/camps/registration-form/registration-form.entity.ts';
import { RegistrationFormRepository } from '../../../../repositories/camps/registration-form/registration-form.repository.ts';

// The form a new Camp starts with, ready to publish as it is: the locked core and the standard fields most
// camps ask, optional until the Camp requires them; the t-shirt, the guardian's address and transport,
// which needs the Camp's boarding places, start off.
const PRESET: FormDefinition = {
  standard: [
    { key: 'gender', state: 'optional' },
    { key: 'birthNumber', state: 'optional' },
    { key: 'insurer', state: 'optional' },
    { key: 'participantAddress', state: 'optional' },
    { key: 'tshirtSize', state: 'off' },
    { key: 'healthNote', state: 'optional' },
    { key: 'campFriend', state: 'optional' },
    { key: 'guardianAddress', state: 'off' },
    { key: 'transport', state: 'off', options: [] },
    { key: 'howDidYouHear', state: 'optional' },
  ],
  custom: [],
};

// The declarations a new Camp starts with, every one mandatory; the Camp adds its own documents to them.
// Fixed ids, so the preset reads the same until the Camp saves its own draft.
const PRESET_DECLARATIONS: Declaration[] = [
  {
    id: '00000000-0000-7000-8000-00000000d001',
    text: 'Beru na vědomí informace o zpracování osobních údajů mých a mého dítěte.',
    mandatory: true,
    url: null,
    fileId: null,
  },
  {
    id: '00000000-0000-7000-8000-00000000d002',
    text: 'Beru na vědomí, že přihláška je závazná.',
    mandatory: true,
    url: null,
    fileId: null,
  },
  {
    id: '00000000-0000-7000-8000-00000000d003',
    text: 'Souhlasím s podmínkami účasti a stornovacími podmínkami tábora.',
    mandatory: true,
    url: null,
    fileId: null,
  },
  {
    id: '00000000-0000-7000-8000-00000000d004',
    text: 'Prohlašuji, že údaje v přihlášce jsou pravdivé a úplné.',
    mandatory: true,
    url: null,
    fileId: null,
  },
];

// An upload no draft names yet is kept this long, so a save by another admin meanwhile never removes the
// PDF someone is about to attach.
const UNSAVED_UPLOAD_KEPT_MS = 24 * 60 * 60 * 1000;

const PRESET_FIELDS = { draft: PRESET, maxParticipants: DEFAULT_MAX_PARTICIPANTS, declarations: PRESET_DECLARATIONS };

// The registration forms of the current Organisation's Camps: a draft each, with its declarations, and
// published versions that never change. Permission (Camp settings) is the route's.
@Injectable()
export class RegistrationFormService {
  constructor(
    private readonly forms: RegistrationFormRepository,
    private readonly camps: CampRepository,
    private readonly files: FileService,
    private readonly audit: AuditService,
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

    return draft.toDto(await this.show(draft.declarations), await this.forms.getLatestVersion(campId));
  }

  /**
   * Store a PDF for a declaration of a Camp's form, for the draft to name, audited.
   * @param actor who does it
   * @param campId Camp id
   * @param upload the PDF
   */
  public async uploadFile(actor: Actor, campId: string, upload: FileUpload): Promise<UploadedDeclarationFile> {
    await this.camps.getByIdOrThrow(campId);
    const fileId = await this.files.store(upload, { allow: ['application/pdf'] });

    await this.forms.addFile(campId, fileId, this.clock.now());
    await this.audit.record(actor, {
      action: 'registration_form_file.create',
      target: { type: 'registration_form_file', id: fileId },
      change: { before: null, after: { campId, fileId } },
    });

    return { fileId, link: await this.files.link(fileId) };
  }

  /**
   * Replace a Camp's draft, audited; the published version stays what guardians see. A PDF the previous
   * draft named and neither this one nor any version does is removed, and so is an upload left unnamed
   * for a day.
   * @param actor who does it
   * @param campId Camp id
   * @param body the draft, the most children per Registration and the declarations
   * @throws {BadRequestException} declaration_file_unknown when a declaration names a PDF not uploaded for
   * the Camp's form
   */
  public async saveDraft(actor: Actor, campId: string, body: SaveRegistrationFormDraftBody): Promise<RegistrationForm> {
    await this.camps.getByIdOrThrow(campId);
    const uploaded = await this.forms.listFiles(campId);

    const uploadedIds = uploaded.map(({ fileId }) => fileId);

    if (body.declarations.some(({ fileId }) => fileId !== null && !uploadedIds.includes(fileId))) {
      throw refused(BadRequestException, 'declaration_file_unknown');
    }

    const before = (await this.forms.getDraft(campId)) ?? presetDraft(campId);
    const after = await this.forms.saveDraft(campId, {
      draft: body.definition,
      maxParticipants: body.maxParticipants,
      declarations: body.declarations,
    });

    await this.removeUnusedFiles(actor, campId, uploaded, before.declarations, after.declarations);
    await this.audit.record(actor, {
      action: 'registration_form.update',
      target: { type: 'registration_form', id: campId },
      change: { before, after },
    });

    return after.toDto(await this.show(after.declarations), await this.forms.getLatestVersion(campId));
  }

  /**
   * Publish a Camp's draft as its next version, its declarations frozen with it, audited. Publishes of
   * one Camp run one after another, so no two get the same number.
   * @param actor who does it
   * @param campId Camp id
   * @throws {ConflictException} form_field_changed when a custom field has another type or scope than in
   * any earlier version; form_definition_invalid when the draft no longer holds together, as when the
   * platform's standard fields changed since it was saved
   */
  public async publish(actor: Actor, campId: string): Promise<RegistrationFormVersion> {
    await this.camps.getByIdOrThrow(campId);
    const { draft, maxParticipants, declarations } = await this.forms.lockDraft(campId, PRESET_FIELDS);
    const latest = await this.forms.getLatestVersion(campId);

    if (!formDefinitionSchema(REGISTRATION_FIELD_CATALOGUE).safeParse(draft).success) {
      throw refused(ConflictException, 'form_definition_invalid');
    }

    // A field removed and added back under its id must also keep what it was, or old answers misfit it.
    const published = await this.forms.listPublished(campId);

    if (published.some(({ definition }) => diffVersions(definition, draft).changed.length > 0)) {
      throw refused(ConflictException, 'form_field_changed');
    }

    const version = await this.forms.createVersion(campId, {
      version: (latest?.version ?? 0) + 1,
      definition: draft,
      maxParticipants,
      declarations,
      publishedAt: this.clock.now(),
    });

    await this.audit.record(actor, {
      action: 'registration_form_version.create',
      target: { type: 'registration_form_version', id: version.id },
      change: { before: null, after: { campId, version: version.version, maxParticipants } },
    });

    return version.toDto(await this.show(version.declarations));
  }

  /**
   * Get one published version of a Camp's form, as it was.
   * @param campId Camp id
   * @param version the version's number
   */
  public async getVersion(campId: string, version: number): Promise<RegistrationFormVersion> {
    await this.camps.getByIdOrThrow(campId);
    const found = await this.forms.getVersionOrThrow(campId, version);

    return found.toDto(await this.show(found.declarations));
  }

  /**
   * Get the latest published form of a Camp of the current Organisation, by its slug or a former one, as
   * guardians fill it in, with links that open the declarations' PDFs for a few minutes.
   * @param slug the slug from the address
   * @throws {NotFoundException} when the Camp is unknown or has published nothing yet (a pending
   * Organisation's subdomain answers nobody)
   */
  public async getPublic(slug: string): Promise<RegistrationFormVersion> {
    const camp = await this.camps.getBySlug(slug.toLowerCase());
    const latest = camp === null ? null : await this.forms.getLatestVersion(camp.id);

    if (latest === null) {
      throw new NotFoundException();
    }

    return latest.toDto(await this.show(latest.declarations));
  }

  /**
   * Show declarations with a short-lived link to each one's PDF.
   * @param declarations the declarations
   */
  private async show(declarations: readonly Declaration[]): Promise<ShownDeclaration[]> {
    const links = await this.files.links(declarations.flatMap(({ fileId }) => (fileId === null ? [] : [fileId])));

    return declarations.map(({ fileId, ...declaration }) => {
      const link = fileId === null ? undefined : links.get(fileId);

      return { ...declaration, file: fileId === null || link === undefined ? null : { id: fileId, link } };
    });
  }

  /**
   * Remove, audited, the PDFs uploaded for a Camp's form that neither its new draft nor any published
   * version names: one the previous draft named, or one nobody named for a day.
   * @param actor who saves
   * @param campId Camp id
   * @param uploaded the PDFs uploaded for the form
   * @param before the previous draft's declarations
   * @param after the new draft's declarations
   */
  private async removeUnusedFiles(
    actor: Actor,
    campId: string,
    uploaded: readonly { fileId: string; uploadedAt: Date }[],
    before: readonly Declaration[],
    after: readonly Declaration[],
  ): Promise<void> {
    const published = await this.forms.listPublished(campId);
    const named = new Set([
      ...after.map(({ fileId }) => fileId),
      ...published.flatMap((version) => version.declarations.map(({ fileId }) => fileId)),
    ]);
    const namedBefore = new Set(before.map(({ fileId }) => fileId));
    const staleBefore = this.clock.now().getTime() - UNSAVED_UPLOAD_KEPT_MS;
    const unused = uploaded.filter(
      ({ fileId, uploadedAt }) => !named.has(fileId) && (namedBefore.has(fileId) || uploadedAt.getTime() < staleBefore),
    );

    for (const { fileId } of unused) {
      await this.forms.removeFile(fileId);
      await this.files.remove(fileId);
      await this.audit.record(actor, {
        action: 'registration_form_file.remove',
        target: { type: 'registration_form_file', id: fileId },
        change: { before: { campId, fileId }, after: null },
      });
    }
  }
}

function refused<E extends BadRequestException | ConflictException>(
  exception: new (body: object) => E,
  code: RegistrationFormErrorCode,
): E {
  return new exception({ code, message: `Registration form refused: ${code}` });
}

function presetDraft(campId: string): RegistrationFormDraftEntity {
  return new RegistrationFormDraftEntity({ campId, ...PRESET_FIELDS });
}
