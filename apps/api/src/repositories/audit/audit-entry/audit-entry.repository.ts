import { Injectable } from '@nestjs/common';
import {
  and,
  desc,
  eq,
  gte,
  inArray,
  like,
  lte,
  sql,
  type InferInsertModel,
  type InferSelectModel,
  type SQL,
} from 'drizzle-orm';

import { UnitOfWork } from '../../../core/database/unit-of-work.ts';
import { auditEntries } from '../../../db/schema.ts';

export type AuditEntryRow = InferSelectModel<typeof auditEntries>;

// What the audit log is filtered by; an actor is matched by identity, and an action by its start.
export interface AuditFilter {
  readonly actorKind?: AuditEntryRow['actorKind'];
  readonly actorIdentities?: readonly string[];
  readonly actionPrefix?: string;
  readonly targetType?: string;
  readonly targetId?: string;
  readonly from?: Date;
  readonly to?: Date;
  readonly after?: string;
}

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

  /**
   * List a page of the current Organisation's audit log, newest first, filtered.
   * @param filter what to keep, and the last entry of the previous page
   * @param limit how many at most
   */
  public async page(filter: AuditFilter, limit: number): Promise<AuditEntryRow[]> {
    const conditions: (SQL | undefined)[] = [
      filter.actorKind === undefined ? undefined : eq(auditEntries.actorKind, filter.actorKind),
      filter.actorIdentities === undefined
        ? undefined
        : inArray(auditEntries.actorIdentity, [...filter.actorIdentities]),
      filter.actionPrefix === undefined
        ? undefined
        : like(auditEntries.action, `${filter.actionPrefix.replaceAll(/[\\%_]/g, (character) => `\\${character}`)}%`),
      filter.targetType === undefined ? undefined : eq(auditEntries.targetType, filter.targetType),
      filter.targetId === undefined ? undefined : eq(auditEntries.targetId, filter.targetId),
      filter.from === undefined ? undefined : gte(auditEntries.occurredAt, filter.from),
      filter.to === undefined ? undefined : lte(auditEntries.occurredAt, filter.to),
      filter.after === undefined
        ? undefined
        : sql`(${auditEntries.occurredAt}, ${auditEntries.id}) < (
            SELECT ${auditEntries.occurredAt}, ${auditEntries.id} FROM ${auditEntries} WHERE ${auditEntries.id} = ${filter.after}
          )`,
    ];

    return this.unitOfWork.db
      .select()
      .from(auditEntries)
      .where(and(...conditions))
      .orderBy(desc(auditEntries.occurredAt), desc(auditEntries.id))
      .limit(limit);
  }
}
