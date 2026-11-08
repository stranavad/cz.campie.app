import { Injectable } from '@nestjs/common';

import type { AuditAction, AuditTargetOf } from '@repo/schema/audit';

import { AuditEntryRepository } from '../../repositories/audit/audit-entry/audit-entry.repository.ts';
import { PlatformAuditEntryRepository } from '../../repositories/audit/platform-audit-entry/platform-audit-entry.repository.ts';
import { Clock } from '../ports/clock/clock.port.ts';
import type { Actor } from './actor.ts';
import { changesBetween, type AuditedRow } from './changes.ts';
import type { PlatformAuditAction } from './platform-actions.ts';

interface EntryInput<Action extends string, TargetType extends string> {
  // What happened, as '<subject>.<verb>', such as 'registration.edit' or 'health_answers.view'.
  readonly action: Action;
  // The record it happened to, of a kind the action may target.
  readonly target: { readonly type: TargetType; readonly id: string };
  // The row before and after a change; omitted for a view or an export.
  readonly change?: { readonly before: AuditedRow | null; readonly after: AuditedRow | null };
  // Encrypted fields the change touched beyond the rows' own byte values, by name, such as answers sealed
  // together in one column: the caller tells which changed by comparing their plaintext.
  readonly encryptedFields?: readonly string[];
}

// An Organisation's audit entry: only an action of the catalogue, on a record it may target.
export type NewAuditEntry<A extends AuditAction = AuditAction> = EntryInput<A, AuditTargetOf<A>>;

export type NewPlatformAuditEntry = EntryInput<PlatformAuditAction, 'admin' | 'organisation'>;

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
   * @param entry what they did, to which record, and the change if any
   */
  public async record<A extends AuditAction>(actor: Actor, entry: NewAuditEntry<A>): Promise<void> {
    const diff = entry.change === undefined ? null : changesBetween(entry.change.before, entry.change.after);
    const person = actor.kind === 'system' ? null : actor;

    await this.entries.create({
      occurredAt: this.clock.now(),
      actorKind: actor.kind,
      actorIdentity: person?.identity ?? null,
      ipAddress: person?.ipAddress ?? null,
      action: entry.action,
      targetType: entry.target.type,
      targetId: entry.target.id,
      changes: diff?.values ?? null,
      encryptedFields: [...new Set([...(diff?.encryptedFields ?? []), ...(entry.encryptedFields ?? [])])],
    });
  }

  /**
   * Record a change above any one Organisation, such as the Platform operator approving or rejecting one,
   * in the platform's audit log, in the current unit of work. It holds plain values only: nothing encrypted
   * is ever above an Organisation.
   * @param actor who did it
   * @param entry what they did, to which record, and the change if any
   */
  public async recordForPlatform(actor: Actor, entry: NewPlatformAuditEntry): Promise<void> {
    const diff = entry.change === undefined ? null : changesBetween(entry.change.before, entry.change.after);
    const person = actor.kind === 'system' ? null : actor;

    await this.platformEntries.create({
      occurredAt: this.clock.now(),
      actorKind: actor.kind,
      actorIdentity: person?.identity ?? null,
      ipAddress: person?.ipAddress ?? null,
      action: entry.action,
      targetType: entry.target.type,
      targetId: entry.target.id,
      changes: diff?.values ?? null,
    });
  }
}
