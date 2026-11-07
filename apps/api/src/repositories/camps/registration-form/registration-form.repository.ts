import { Injectable, NotFoundException } from '@nestjs/common';
import { and, asc, desc, eq } from 'drizzle-orm';

import type { FormDefinition } from '@repo/schema/form-engine';

import { UnitOfWork } from '../../../core/database/unit-of-work.ts';
import { registrationForms, registrationFormVersions } from '../../../db/schema.ts';
import { RegistrationFormDraftEntity, RegistrationFormVersionEntity } from './registration-form.entity.ts';

export interface DraftFields {
  readonly draft: FormDefinition;
  readonly maxParticipants: number;
}

@Injectable()
export class RegistrationFormRepository {
  constructor(private readonly unitOfWork: UnitOfWork) {}

  /**
   * Get a Camp's saved draft.
   * @param campId Camp id
   */
  public async getDraft(campId: string): Promise<RegistrationFormDraftEntity | null> {
    const [row] = await this.unitOfWork.db.select().from(registrationForms).where(eq(registrationForms.campId, campId));

    return row === undefined ? null : new RegistrationFormDraftEntity(row);
  }

  /**
   * Get a Camp's draft locked until the unit of work ends, saving the given one first when the Camp has
   * none, so publishes of one Camp run one after another.
   * @param campId Camp id
   * @param preset the draft a Camp starts with
   */
  public async lockDraft(campId: string, preset: DraftFields): Promise<RegistrationFormDraftEntity> {
    await this.unitOfWork.db
      .insert(registrationForms)
      .values({ organisationId: this.unitOfWork.organisationId, campId, ...preset })
      .onConflictDoNothing();

    const [row] = await this.unitOfWork.db
      .select()
      .from(registrationForms)
      .where(eq(registrationForms.campId, campId))
      .for('update');

    if (row === undefined) {
      throw new NotFoundException();
    }

    return new RegistrationFormDraftEntity(row);
  }

  /**
   * Save a Camp's draft, replacing the one it had.
   * @param campId Camp id
   * @param fields the draft and the most children per Registration
   */
  public async saveDraft(campId: string, fields: DraftFields): Promise<RegistrationFormDraftEntity> {
    const [row] = await this.unitOfWork.db
      .insert(registrationForms)
      .values({ organisationId: this.unitOfWork.organisationId, campId, ...fields })
      .onConflictDoUpdate({ target: [registrationForms.organisationId, registrationForms.campId], set: fields })
      .returning();

    if (row === undefined) {
      throw new Error('The draft was not saved');
    }

    return new RegistrationFormDraftEntity(row);
  }

  /**
   * Get a Camp's latest published version.
   * @param campId Camp id
   */
  public async getLatestVersion(campId: string): Promise<RegistrationFormVersionEntity | null> {
    const [row] = await this.unitOfWork.db
      .select()
      .from(registrationFormVersions)
      .where(eq(registrationFormVersions.campId, campId))
      .orderBy(desc(registrationFormVersions.version))
      .limit(1);

    return row === undefined ? null : new RegistrationFormVersionEntity(row);
  }

  /**
   * List the definitions of every published version of a Camp's form, oldest first.
   * @param campId Camp id
   */
  public async listDefinitions(campId: string): Promise<FormDefinition[]> {
    const rows = await this.unitOfWork.db
      .select({ definition: registrationFormVersions.definition })
      .from(registrationFormVersions)
      .where(eq(registrationFormVersions.campId, campId))
      .orderBy(asc(registrationFormVersions.version));

    return rows.map(({ definition }) => definition);
  }

  /**
   * Get one published version of a Camp's form, or throw if missing.
   * @param campId Camp id
   * @param version the version's number
   * @throws {NotFoundException} when the Camp has no such version in the current Organisation
   */
  public async getVersionOrThrow(campId: string, version: number): Promise<RegistrationFormVersionEntity> {
    const [row] = await this.unitOfWork.db
      .select()
      .from(registrationFormVersions)
      .where(and(eq(registrationFormVersions.campId, campId), eq(registrationFormVersions.version, version)));

    if (row === undefined) {
      throw new NotFoundException();
    }

    return new RegistrationFormVersionEntity(row);
  }

  /**
   * Publish a version of a Camp's form.
   * @param campId Camp id
   * @param input its number, definition, most children and time
   * @throws {Error} when the database returns no row
   */
  public async createVersion(
    campId: string,
    input: { version: number; definition: FormDefinition; maxParticipants: number; publishedAt: Date },
  ): Promise<RegistrationFormVersionEntity> {
    const [row] = await this.unitOfWork.db
      .insert(registrationFormVersions)
      .values({ ...input, campId, organisationId: this.unitOfWork.organisationId })
      .returning();

    if (row === undefined) {
      throw new Error('The version was not published');
    }

    return new RegistrationFormVersionEntity(row);
  }
}
