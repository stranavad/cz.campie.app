import { Injectable } from '@nestjs/common';

import { AuditEntryRepository } from '../../repositories/audit/audit-entry/audit-entry.repository.ts';
import { Clock } from '../ports/clock/clock.port.ts';
import type { Actor } from './actor.ts';
import { changesBetween, type AuditedRow } from './changes.ts';

export interface AuditTarget {
  // What kind of record, such as 'registration' or 'health_record'.
  readonly type: string;
  readonly id: string;
}

export interface AuditEvent {
  // What happened, as '<target type>.<verb>', such as 'registration.update' or 'health_record.view'.
  readonly action: string;
  readonly target: AuditTarget;
  // The row before and after a change; omitted for a view or an export.
  readonly change?: { readonly before: AuditedRow | null; readonly after: AuditedRow | null };
}

@Injectable()
export class AuditService {
  constructor(
    private readonly entries: AuditEntryRepository,
    private readonly clock: Clock,
  ) {}

  /**
   * Record a change, a view of health data or a sensitive export in the current unit of work, so it
   * commits or rolls back with the change itself. Encrypted fields are recorded by name only, and an
   * encrypted value counts as changed whenever its ciphertext differs, so re-encrypt only changed values.
   * @param actor who did it
   * @param event what they did, to which record, and the change if any
   */
  public async record(actor: Actor, event: AuditEvent): Promise<void> {
    const diff = event.change === undefined ? null : changesBetween(event.change.before, event.change.after);
    const person = actor.kind === 'system' ? null : actor;

    await this.entries.create({
      occurredAt: this.clock.now(),
      actorKind: actor.kind,
      actorIdentity: person?.identity ?? null,
      ipAddress: person?.ipAddress ?? null,
      action: event.action,
      targetType: event.target.type,
      targetId: event.target.id,
      changes: diff?.values ?? null,
      encryptedFields: [...(diff?.encryptedFields ?? [])],
    });
  }
}
