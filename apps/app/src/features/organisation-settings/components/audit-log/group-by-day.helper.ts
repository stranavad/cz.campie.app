import type { AuditEntry } from '@repo/schema/audit';
import { pragueDateOf } from '@repo/schema/shared';

export interface AuditLogDay {
  // YYYY-MM-DD in Prague.
  date: string;
  entries: AuditEntry[];
}

/**
 * Group the log's entries by the Prague day they happened on, keeping their order (newest first).
 * @param entries the loaded entries, newest first
 */
export function groupByDay(entries: AuditEntry[]): AuditLogDay[] {
  const days: AuditLogDay[] = [];

  for (const entry of entries) {
    const date = pragueDateOf(new Date(entry.occurredAt));
    const last = days.at(-1);

    if (last?.date === date) {
      last.entries.push(entry);
    } else {
      days.push({ date, entries: [entry] });
    }
  }

  return days;
}
