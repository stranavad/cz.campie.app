import { Injectable } from '@nestjs/common';
import type { InferInsertModel, InferSelectModel } from 'drizzle-orm';

import { UnitOfWork } from '../../../core/database/unit-of-work.ts';
import { legalAcceptances } from '../../../db/schema.ts';

export type CreateLegalAcceptance = Omit<InferInsertModel<typeof legalAcceptances>, 'id'>;
export type LegalAcceptanceSelectModel = InferSelectModel<typeof legalAcceptances>;

// Written once at signup and read by nobody yet, so it has no entity; the rows go to the audit log.
@Injectable()
export class LegalAcceptanceRepository {
  constructor(private readonly unitOfWork: UnitOfWork) {}

  /**
   * Record accepted legal documents.
   * @param input one acceptance per document
   */
  public createMany(input: readonly CreateLegalAcceptance[]): Promise<LegalAcceptanceSelectModel[]> {
    return this.unitOfWork.db
      .insert(legalAcceptances)
      .values([...input])
      .returning();
  }
}
