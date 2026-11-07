import { Injectable } from '@nestjs/common';
import { and, asc, desc, eq, inArray, type InferInsertModel, type InferSelectModel } from 'drizzle-orm';

import { UnitOfWork } from '../../../core/database/unit-of-work.ts';
import { consentFiles, consents, consentVersions } from '../../../db/schema.ts';

export type ConsentRow = InferSelectModel<typeof consents>;
export type ConsentVersionRow = InferSelectModel<typeof consentVersions>;
export type ConsentFileRow = InferSelectModel<typeof consentFiles>;
export type CreateConsentVersion = Omit<InferInsertModel<typeof consentVersions>, 'id' | 'organisationId'>;

// A Camp's Consents, their published versions, which are only ever added, and the PDFs uploaded for them.
@Injectable()
export class ConsentRepository {
  constructor(private readonly unitOfWork: UnitOfWork) {}

  /**
   * List a Camp's Consents, oldest first.
   * @param campId Camp id
   */
  public async listByCamp(campId: string): Promise<ConsentRow[]> {
    return this.unitOfWork.db
      .select()
      .from(consents)
      .where(eq(consents.campId, campId))
      .orderBy(asc(consents.createdAt), asc(consents.id));
  }

  /**
   * Get a Consent of a Camp and lock it until the unit of work ends, so its versions are numbered one at a
   * time.
   * @param campId Camp id
   * @param id Consent id
   */
  public async getForUpdate(campId: string, id: string): Promise<ConsentRow | null> {
    const [row] = await this.unitOfWork.db
      .select()
      .from(consents)
      .where(and(eq(consents.campId, campId), eq(consents.id, id)))
      .for('update');

    return row ?? null;
  }

  /**
   * Get a Consent of a Camp.
   * @param campId Camp id
   * @param id Consent id
   */
  public async get(campId: string, id: string): Promise<ConsentRow | null> {
    const [row] = await this.unitOfWork.db
      .select()
      .from(consents)
      .where(and(eq(consents.campId, campId), eq(consents.id, id)));

    return row ?? null;
  }

  /**
   * Create a Consent of a Camp in the current Organisation, still without a version.
   * @param campId Camp id
   * @param createdAt when
   * @throws {Error} when the database returns no row
   */
  public async create(campId: string, createdAt: Date): Promise<ConsentRow> {
    const [row] = await this.unitOfWork.db
      .insert(consents)
      .values({ campId, createdAt, organisationId: this.unitOfWork.organisationId })
      .returning();

    if (row === undefined) {
      throw new Error('The Consent was not created');
    }

    return row;
  }

  /**
   * List the versions of Consents, newest first within each.
   * @param consentIds Consent ids
   */
  public async listVersionsOf(consentIds: readonly string[]): Promise<ConsentVersionRow[]> {
    if (consentIds.length === 0) {
      return [];
    }

    return this.unitOfWork.db
      .select()
      .from(consentVersions)
      .where(inArray(consentVersions.consentId, [...consentIds]))
      .orderBy(asc(consentVersions.consentId), desc(consentVersions.version));
  }

  /**
   * List the newest version of each of Consents.
   * @param consentIds Consent ids
   */
  public async listNewestVersionsOf(consentIds: readonly string[]): Promise<ConsentVersionRow[]> {
    if (consentIds.length === 0) {
      return [];
    }

    return this.unitOfWork.db
      .selectDistinctOn([consentVersions.consentId])
      .from(consentVersions)
      .where(inArray(consentVersions.consentId, [...consentIds]))
      .orderBy(consentVersions.consentId, desc(consentVersions.version));
  }

  /**
   * Publish a version of a Consent.
   * @param input the version
   * @throws {Error} when the database returns no row
   */
  public async addVersion(input: CreateConsentVersion): Promise<ConsentVersionRow> {
    const [row] = await this.unitOfWork.db
      .insert(consentVersions)
      .values({ ...input, organisationId: this.unitOfWork.organisationId })
      .returning();

    if (row === undefined) {
      throw new Error('The Consent version was not published');
    }

    return row;
  }

  /**
   * Record a PDF uploaded for a Camp's Consents.
   * @param input the Camp, the stored file, its SHA-256 and when
   */
  public async addFile(input: Omit<ConsentFileRow, 'organisationId'>): Promise<void> {
    await this.unitOfWork.db.insert(consentFiles).values({ ...input, organisationId: this.unitOfWork.organisationId });
  }

  /**
   * Get a PDF uploaded for a Camp's Consents.
   * @param campId Camp id
   * @param fileId the stored file
   */
  public async getFile(campId: string, fileId: string): Promise<ConsentFileRow | null> {
    const [row] = await this.unitOfWork.db
      .select()
      .from(consentFiles)
      .where(and(eq(consentFiles.campId, campId), eq(consentFiles.fileId, fileId)));

    return row ?? null;
  }
}
