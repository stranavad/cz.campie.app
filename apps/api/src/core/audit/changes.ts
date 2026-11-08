import { isDeepStrictEqual } from 'node:util';

// A row as a service holds it before or after a change, an entity or a plain object: its own fields are
// the column values by field name.
export type AuditedRow = object;

export interface ValueChange {
  readonly old: unknown;
  readonly new: unknown;
}

export interface Changes {
  // Old and new values of the plain fields that changed, by field name.
  readonly values: Readonly<Record<string, ValueChange>>;
  // Names of the encrypted fields that changed; their values never enter the audit log.
  readonly encryptedFields: readonly string[];
}

// Encrypted columns hold bytes, so any byte value is treated as encrypted: neither its ciphertext nor
// anything derived from it is recorded.
function isEncrypted(value: unknown): boolean {
  return Buffer.isBuffer(value);
}

// Fields that say nothing to a reader of the log: the record's id and Organisation, when its row was
// written, and how a signature's browser identified itself or a file is checked. The entry has its own
// time and IP address.
const INTERNAL_FIELDS = new Set([
  'id',
  'organisationId',
  'createdAt',
  'updatedAt',
  'ipAddress',
  'userAgent',
  'sha256',
  'fileSha256',
]);

// Identifiers an outside service gave, which end like a foreign key but name what the Organisation sees there.
const OUTSIDE_IDS = new Set(['merchantId', 'gatewayTransactionId']);

/**
 * Tell whether a field is noise in the log: internal, or a foreign key to another record (`campId`), which
 * the entry's target already names.
 * @param field the field's name
 */
function isNoise(field: string): boolean {
  return INTERNAL_FIELDS.has(field) || (/[a-z]Id$/.test(field) && !OUTSIDE_IDS.has(field));
}

// The value as JSON stores it: instants as ISO strings.
function toJson(value: unknown): unknown {
  if (value instanceof Date) {
    return value.toISOString();
  }

  return value;
}

/**
 * Compare a row before and after a change, field by field, leaving out ids, foreign keys and other noise. A
 * created row has no before, a removed one no after.
 * @param before the row before the change, or null when it was created
 * @param after the row after the change, or null when it was removed
 */
export function changesBetween(before: AuditedRow | null, after: AuditedRow | null): Changes {
  const old = new Map<string, unknown>(Object.entries(before ?? {}));
  const current = new Map<string, unknown>(Object.entries(after ?? {}));
  const fields = new Set([...old.keys(), ...current.keys()].filter((field) => !isNoise(field)));
  const values: Record<string, ValueChange> = {};
  const encryptedFields: string[] = [];

  for (const field of fields) {
    const oldValue = old.get(field) ?? null;
    const newValue = current.get(field) ?? null;

    if (isDeepStrictEqual(oldValue, newValue)) {
      continue;
    }

    if (isEncrypted(oldValue) || isEncrypted(newValue)) {
      encryptedFields.push(field);
    } else {
      values[field] = { old: toJson(oldValue), new: toJson(newValue) };
    }
  }

  return { values, encryptedFields };
}
