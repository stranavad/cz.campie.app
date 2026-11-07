import { Injectable } from '@nestjs/common';

import type { AuditLogEntry, AuditLogPage, AuditLogQuery } from '@repo/schema/organisations';

import { AdminRepository } from '../../../../repositories/admins/admin/admin.repository.ts';
import { AuditEntryRepository } from '../../../../repositories/audit/audit-entry/audit-entry.repository.ts';

const PAGE_SIZE = 50;

// The Organisation's whole audit log for its Owners: filtered, newest first, a page at a time, with plain
// values and encrypted fields by name only, as the entries keep them. Permission (Owners) is the route's.
@Injectable()
export class AuditLogService {
  constructor(
    private readonly entries: AuditEntryRepository,
    private readonly admins: AdminRepository,
  ) {}

  /**
   * List a page of the audit log.
   * @param query the filters and where the previous page ended
   */
  public async list(query: AuditLogQuery): Promise<AuditLogPage> {
    // An admin is recorded by id, a guardian by email; an email asked for may be either.
    const admin = query.actor === undefined ? null : await this.admins.getByEmail(query.actor);
    const rows = await this.entries.page(
      {
        ...(query.actorKind === undefined ? {} : { actorKind: query.actorKind }),
        ...(query.actor === undefined
          ? {}
          : { actorIdentities: admin === null ? [query.actor] : [query.actor, admin.id] }),
        ...(query.action === undefined || query.action === '' ? {} : { actionPrefix: query.action }),
        ...(query.targetType === undefined || query.targetType === '' ? {} : { targetType: query.targetType }),
        ...(query.targetId === undefined ? {} : { targetId: query.targetId }),
        ...(query.from === undefined ? {} : { from: new Date(query.from) }),
        ...(query.to === undefined ? {} : { to: new Date(query.to) }),
        ...(query.after === undefined ? {} : { after: query.after }),
      },
      PAGE_SIZE + 1,
    );
    const page = rows.slice(0, PAGE_SIZE);
    const emails = await this.admins.listEmailsByIds([
      ...new Set(
        page.flatMap(({ actorKind, actorIdentity }) =>
          (actorKind === 'admin' || actorKind === 'operator') && actorIdentity !== null ? [actorIdentity] : [],
        ),
      ),
    ]);

    return {
      entries: page.map((entry): AuditLogEntry => ({
        id: entry.id,
        occurredAt: entry.occurredAt.toISOString(),
        actor: {
          kind: entry.actorKind,
          name:
            entry.actorIdentity === null
              ? null
              : entry.actorKind === 'guardian'
                ? entry.actorIdentity
                : (emails.get(entry.actorIdentity) ?? null),
        },
        ipAddress: entry.ipAddress,
        action: entry.action,
        target: { type: entry.targetType, id: entry.targetId },
        changes: entry.changes,
        encryptedFields: entry.encryptedFields,
      })),
      next: rows.length > PAGE_SIZE ? (page.at(-1)?.id ?? null) : null,
    };
  }
}
