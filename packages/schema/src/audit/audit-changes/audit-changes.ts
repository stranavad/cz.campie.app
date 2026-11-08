import { czechDate, czechDateTime, czk } from '@repo/schema/shared';

import { auditSubjectOf, isAuditAction } from '../audit-catalogue/audit-actions.ts';
import {
  auditFieldOf,
  type AuditField,
  type AuditFieldLabel,
  type AuditValueSet,
} from '../audit-catalogue/audit-fields.ts';

export interface AuditValueChange {
  readonly old: unknown;
  readonly new: unknown;
}

// Old and new values of an entry's plain fields, by field name, as the audit log keeps them.
export type AuditChanges = Readonly<Record<string, AuditValueChange>>;

// The app's texts the description needs: a field's name, a value of a fixed set (the value itself where the
// app has no text for it), and Ano or Ne.
export interface AuditTexts {
  readonly field: (label: AuditFieldLabel) => string;
  readonly value: (set: AuditValueSet, value: string) => string;
  readonly yesNo: (value: boolean) => string;
}

// One changed field as a reader sees it: its name and its values in Czech. A created record shows only the
// new value, a removed one only the old.
export interface AuditChangeRow {
  readonly field: string;
  readonly label: string;
  readonly old?: string;
  readonly new?: string;
}

export interface AuditChangeList {
  readonly rows: AuditChangeRow[];
  // Fields the audit log has no name for, kept as recorded for the entry's details.
  readonly untranslated: Record<string, AuditValueChange>;
}

const EMPTY = '-';

/**
 * Write a value as it is, an item of a list by its plain values, and a person (a guardian, a child) by name
 * alone, so no id or raw date of theirs shows.
 * @param value the recorded value
 */
function plain(value: unknown): string {
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  if (Array.isArray(value)) {
    return value.map(plain).join(', ');
  }

  if (typeof value === 'object' && value !== null) {
    const { firstName, lastName } = value as { firstName?: unknown; lastName?: unknown };

    if (typeof firstName === 'string' || typeof lastName === 'string') {
      return [firstName, lastName].filter((part) => typeof part === 'string' && part !== '').join(' ');
    }

    return Object.values(value)
      .filter((part) => part !== null && part !== '' && typeof part !== 'object')
      .map(plain)
      .join(' ');
  }

  return EMPTY;
}

/**
 * Write a recorded value the way its field reads in Czech; a value of an unexpected shape as it is.
 * @param field how the audit log names the field
 * @param value the recorded value
 * @param text the app's translations
 */
function formatted(field: AuditField, value: unknown, text: AuditTexts): string {
  if (value === null || value === undefined || value === '' || (Array.isArray(value) && value.length === 0)) {
    return EMPTY;
  }

  const translated = (item: unknown) =>
    field.values === undefined || typeof item !== 'string' ? plain(item) : text.value(field.values, item);

  switch (field.kind) {
    case 'boolean':
      return typeof value === 'boolean' ? text.yesNo(value) : plain(value);
    case 'money':
      return typeof value === 'number' ? czk(value) : plain(value);
    case 'date':
      return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) ? czechDate(value) : plain(value);
    case 'datetime':
      return typeof value === 'string' && !Number.isNaN(Date.parse(value)) ? czechDateTime(value) : plain(value);
    case 'enum':
      return translated(value);
    case 'list':
      return Array.isArray(value) ? value.map(translated).join(', ') : plain(value);
    case 'text':
    case 'email':
      return plain(value);
  }
}

/**
 * Tell which values an entry shows: a created record its new ones, a removed one its old ones, a change both.
 * An action that creates without saying so (a submission, a signature) has nothing before; one that ends a
 * record has nothing after.
 * @param action the entry's action
 * @param changes its changes
 */
function sidesOf(action: string, changes: AuditChanges): { old: boolean; new: boolean } {
  const verb = action.slice(action.indexOf('.') + 1);
  const values = Object.values(changes);
  const created = verb === 'create' || (verb !== 'update' && values.every((change) => change.old === null));
  const removed = verb === 'remove' || (verb !== 'update' && values.every((change) => change.new === null));

  return { old: !created, new: !removed || created };
}

/**
 * Describe an entry's changes for a reader: the fields its subject names, in Czech, and the rest as recorded.
 * @param action the entry's action
 * @param changes its changes, or null when it has none or they were scrubbed
 * @param text the app's translations
 */
export function auditChangesOf(action: string, changes: AuditChanges | null, text: AuditTexts): AuditChangeList {
  const rows: AuditChangeRow[] = [];
  const untranslated: Record<string, AuditValueChange> = {};

  if (changes === null) {
    return { rows, untranslated };
  }

  const subject = isAuditAction(action) ? auditSubjectOf(action) : null;
  const sides = sidesOf(action, changes);

  for (const [name, change] of Object.entries(changes)) {
    const field = subject === null ? undefined : auditFieldOf(subject, name);

    if (field === undefined) {
      untranslated[name] = change;
      continue;
    }

    const old = formatted(field, change.old, text);
    const current = formatted(field, change.new, text);

    // What changed lies deeper than the field reads, such as a child's answers beside their name.
    if (sides.old && sides.new && old === current) {
      untranslated[name] = change;
      continue;
    }

    rows.push({
      field: name,
      label: text.field(field.label),
      ...(sides.old ? { old } : {}),
      ...(sides.new ? { new: current } : {}),
    });
  }

  return { rows, untranslated };
}
