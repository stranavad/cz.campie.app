import { createHash } from 'node:crypto';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';

import type {
  Consent,
  ConsentContent,
  ConsentErrorCode,
  ConsentSummary,
  ConsentVersion,
  UploadedConsentFile,
} from '@repo/schema/consents';

import type { Actor } from '../../../../core/audit/actor.ts';
import { AuditService } from '../../../../core/audit/audit.service.ts';
import type { FileUpload } from '../../../../core/files/file-upload.ts';
import { FileService } from '../../../../core/files/file.service.ts';
import { Clock } from '../../../../core/ports/clock/clock.port.ts';
import { CampRepository } from '../../../../repositories/camps/camp/camp.repository.ts';
import {
  ConsentRepository,
  type ConsentRow,
  type ConsentVersionRow,
} from '../../../../repositories/consents/consent/consent.repository.ts';

/**
 * Tell whether content says the same as a published version.
 * @param content what an admin sent
 * @param version the version
 */
function sameContent(content: ConsentContent, version: ConsentVersionRow): boolean {
  return (
    content.title === version.title &&
    content.introduction === version.introduction &&
    content.withdrawable === version.withdrawable &&
    content.fileId === version.fileId &&
    content.items.length === version.items.length &&
    content.items.every(({ id, kind, text }, index) => {
      const published = version.items[index];

      return published?.id === id && published.kind === kind && published.text === text;
    })
  );
}

// A Camp's Consents: each save publishes a new version and never changes an earlier one, so what was
// signed stays provable. Permission (Camp settings) is the route's.
@Injectable()
export class ConsentService {
  constructor(
    private readonly consents: ConsentRepository,
    private readonly camps: CampRepository,
    private readonly files: FileService,
    private readonly audit: AuditService,
    private readonly clock: Clock,
  ) {}

  /**
   * List a Camp's Consents by their newest versions.
   * @param campId Camp id
   */
  public async list(campId: string): Promise<ConsentSummary[]> {
    await this.camps.getByIdOrThrow(campId);
    const consents = await this.consents.listByCamp(campId);
    const newestOf = new Map(
      (await this.consents.listNewestVersionsOf(consents.map(({ id }) => id))).map((version) => [
        version.consentId,
        version,
      ]),
    );

    return consents.flatMap((consent) => {
      const newest = newestOf.get(consent.id);

      return newest === undefined
        ? []
        : [
            {
              id: consent.id,
              title: newest.title,
              version: newest.version,
              withdrawable: newest.withdrawable,
              publishedAt: newest.publishedAt.toISOString(),
            },
          ];
    });
  }

  /**
   * Get a Consent of a Camp with all its versions.
   * @param campId Camp id
   * @param consentId Consent id
   * @throws {NotFoundException} when the Camp has no such Consent
   */
  public async get(campId: string, consentId: string): Promise<Consent> {
    const consent = await this.consents.get(campId, consentId);

    if (consent === null) {
      throw new NotFoundException();
    }

    return this.show(consent);
  }

  /**
   * Create a Consent of a Camp and publish its version 1, audited.
   * @param actor who does it
   * @param campId Camp id
   * @param content the title, introduction, items, withdrawable flag and PDF
   */
  public async create(actor: Actor, campId: string, content: ConsentContent): Promise<Consent> {
    await this.camps.getByIdOrThrow(campId);
    const sha256 = await this.fingerprintOf(campId, content.fileId);
    const consent = await this.consents.create(campId, this.clock.now());

    await this.audit.record(actor, {
      action: 'consent.create',
      target: { type: 'consent', id: consent.id },
      change: { before: null, after: { campId } },
    });
    await this.publishVersion(actor, consent, 1, content, sha256);

    return this.show(consent);
  }

  /**
   * Publish changed content as a Consent's next version, audited; unchanged content publishes nothing.
   * @param actor who does it
   * @param campId Camp id
   * @param consentId Consent id
   * @param content the new content
   * @throws {NotFoundException} when the Camp has no such Consent
   */
  public async publish(actor: Actor, campId: string, consentId: string, content: ConsentContent): Promise<Consent> {
    const consent = await this.consents.getForUpdate(campId, consentId);

    if (consent === null) {
      throw new NotFoundException();
    }

    const [newest] = await this.consents.listVersionsOf([consent.id]);

    if (newest === undefined || !sameContent(content, newest)) {
      const sha256 = await this.fingerprintOf(campId, content.fileId);

      await this.publishVersion(actor, consent, (newest?.version ?? 0) + 1, content, sha256);
    }

    return this.show(consent);
  }

  /**
   * Store a PDF for a Camp's Consents, encrypted, with the SHA-256 of its bytes, audited.
   * @param actor who does it
   * @param campId Camp id
   * @param upload the PDF
   */
  public async uploadFile(actor: Actor, campId: string, upload: FileUpload): Promise<UploadedConsentFile> {
    await this.camps.getByIdOrThrow(campId);
    const sha256 = createHash('sha256').update(upload.bytes).digest('hex');
    const fileId = await this.files.store(upload, { allow: ['application/pdf'] });

    await this.consents.addFile({ campId, fileId, sha256, uploadedAt: this.clock.now() });
    await this.audit.record(actor, {
      action: 'consent_file.create',
      target: { type: 'consent_file', id: fileId },
      change: { before: null, after: { campId, fileId, sha256 } },
    });

    return { fileId, sha256, link: await this.files.link(fileId) };
  }

  /**
   * Publish one version of a Consent, audited.
   * @param actor who does it
   * @param consent the Consent
   * @param version its number
   * @param content the content
   * @param sha256 the attached PDF's fingerprint, or null without one
   */
  private async publishVersion(
    actor: Actor,
    consent: ConsentRow,
    version: number,
    content: ConsentContent,
    sha256: string | null,
  ): Promise<void> {
    const published = await this.consents.addVersion({
      consentId: consent.id,
      version,
      title: content.title,
      introduction: content.introduction,
      items: content.items,
      withdrawable: content.withdrawable,
      fileId: content.fileId,
      fileSha256: sha256,
      publishedAt: this.clock.now(),
    });

    await this.audit.record(actor, {
      action: 'consent.publish',
      target: { type: 'consent', id: consent.id },
      change: { before: null, after: published },
    });
  }

  /**
   * Find the fingerprint of a PDF uploaded for a Camp's Consents.
   * @param campId Camp id
   * @param fileId the PDF, or null for none
   * @throws {BadRequestException} consent_file_unknown when the Camp's Consents have no such PDF
   */
  private async fingerprintOf(campId: string, fileId: string | null): Promise<string | null> {
    if (fileId === null) {
      return null;
    }

    const file = await this.consents.getFile(campId, fileId);

    if (file === null) {
      const code: ConsentErrorCode = 'consent_file_unknown';

      throw new BadRequestException({ code, message: 'No such PDF was uploaded for the Consents' });
    }

    return file.sha256;
  }

  /**
   * Show a Consent with its versions, newest first, each PDF with a short-lived link.
   * @param consent the Consent
   */
  private async show(consent: ConsentRow): Promise<Consent> {
    const versions = await this.consents.listVersionsOf([consent.id]);
    const links = await this.files.links(versions.flatMap(({ fileId }) => (fileId === null ? [] : [fileId])));
    const shown = versions.map((version): ConsentVersion => {
      const link = version.fileId === null ? undefined : links.get(version.fileId);

      return {
        id: version.id,
        version: version.version,
        title: version.title,
        introduction: version.introduction,
        items: version.items,
        withdrawable: version.withdrawable,
        file:
          version.fileId === null || version.fileSha256 === null || link === undefined
            ? null
            : { id: version.fileId, sha256: version.fileSha256, link },
        publishedAt: version.publishedAt.toISOString(),
      };
    });

    return { id: consent.id, campId: consent.campId, versions: shown };
  }
}
