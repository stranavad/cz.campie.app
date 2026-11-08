import { Injectable } from '@nestjs/common';

import { AuditEntryRepository } from '../../repositories/audit/audit-entry/audit-entry.repository.ts';
import { PlatformAuditEntryRepository } from '../../repositories/audit/platform-audit-entry/platform-audit-entry.repository.ts';
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
  // Encrypted fields the change touched beyond the rows' own byte values, by name, such as answers sealed
  // together in one column: the caller tells which changed by comparing their plaintext.
  readonly encryptedFields?: readonly string[];
}

@Injectable()
export class AuditService {
  constructor(
    private readonly entries: AuditEntryRepository,
    private readonly platformEntries: PlatformAuditEntryRepository,
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
      encryptedFields: [...new Set([...(diff?.encryptedFields ?? []), ...(event.encryptedFields ?? [])])],
    });
  }

  /**
   * Record a change above any one Organisation, such as the Platform operator approving or rejecting one,
   * in the platform's audit log, in the current unit of work. It holds plain values only: nothing encrypted
   * is ever above an Organisation.
   * @param actor who did it
   * @param event what they did, to which record, and the change if any
   */
  public async recordForPlatform(actor: Actor, event: AuditEvent): Promise<void> {
    const diff = event.change === undefined ? null : changesBetween(event.change.before, event.change.after);
    const person = actor.kind === 'system' ? null : actor;

    await this.platformEntries.create({
      occurredAt: this.clock.now(),
      actorKind: actor.kind,
      actorIdentity: person?.identity ?? null,
      ipAddress: person?.ipAddress ?? null,
      action: event.action,
      targetType: event.target.type,
      targetId: event.target.id,
      changes: diff?.values ?? null,
    });
  }
}
