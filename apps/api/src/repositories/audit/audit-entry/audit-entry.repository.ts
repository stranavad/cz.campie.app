import { Injectable } from '@nestjs/common';
import { desc, inArray, type InferInsertModel, type InferSelectModel } from 'drizzle-orm';

import { UnitOfWork } from '../../../core/database/unit-of-work.ts';
import { auditEntries } from '../../../db/schema.ts';

@Injectable()
export class AuditEntryRepository {
  constructor(private readonly unitOfWork: UnitOfWork) {}

  /**
   * Append an entry to the current Organisation's audit log.
   * @param input the entry, without its Organisation
   */
  public async create(input: Omit<InferInsertModel<typeof auditEntries>, 'id' | 'organisationId'>): Promise<void> {
    await this.unitOfWork.db.insert(auditEntries).values({ ...input, organisationId: this.unitOfWork.organisationId });
  }

  /**
   * List the current Organisation's audit entries that target any of some records, newest first.
   * @param targetIds the records' ids
   */
  public async listByTargets(targetIds: readonly string[]): Promise<InferSelectModel<typeof auditEntries>[]> {
    if (targetIds.length === 0) {
      return [];
    }

    return this.unitOfWork.db
      .select()
      .from(auditEntries)
      .where(inArray(auditEntries.targetId, [...targetIds]))
      .orderBy(desc(auditEntries.occurredAt), desc(auditEntries.id));
  }
}
