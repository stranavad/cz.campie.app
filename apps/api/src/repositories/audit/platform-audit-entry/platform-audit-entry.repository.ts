import { Injectable } from '@nestjs/common';
import type { InferInsertModel } from 'drizzle-orm';

import { UnitOfWork } from '../../../core/database/unit-of-work.ts';
import { platformAuditEntries } from '../../../db/schema.ts';

@Injectable()
export class PlatformAuditEntryRepository {
  constructor(private readonly unitOfWork: UnitOfWork) {}

  /**
   * Append an entry to the platform's audit log.
   * @param input the entry
   */
  public async create(input: Omit<InferInsertModel<typeof platformAuditEntries>, 'id'>): Promise<void> {
    await this.unitOfWork.db.insert(platformAuditEntries).values(input);
  }
}
