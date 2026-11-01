import { Injectable } from '@nestjs/common';
import type { InferInsertModel } from 'drizzle-orm';

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
}
