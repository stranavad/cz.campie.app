import { z } from 'zod';

export const AUDIT_ACTOR_KINDS = ['admin', 'guardian', 'operator', 'system'] as const;

// Whether an entry's record is still there: removed since, or an Erased Registration (or one of its
// Participants), which is named by nothing personal.
export const AUDIT_TARGET_STATES = ['present', 'removed', 'erased'] as const;

export const auditTargetSchema = z.object({
  type: z.string(),
  id: z.uuid(),
  // What the record is called now, read when the log is: a Camp's name, a Registration's Participants, a
  // member's email. Null for a record with no name, a removed or an erased one.
  label: z.string().nullable(),
  // A Registration's Variable symbol, beside its Participants' names.
  variableSymbol: z.string().nullable(),
  state: z.enum(AUDIT_TARGET_STATES),
  // The page the record opens on, where it has one.
  link: z
    .discriminatedUnion('page', [
      z.object({ page: z.literal('registration'), registrationId: z.uuid() }),
      z.object({ page: z.literal('camp'), campId: z.uuid() }),
    ])
    .nullable(),
});

export type AuditTarget = z.infer<typeof auditTargetSchema>;

// A changed encrypted field, by name only: a custom form field under its label in the Registration's form,
// a standard one under the platform's label key; neither for a field outside the registration form.
export const auditEncryptedFieldSchema = z.object({
  field: z.string(),
  label: z.string().nullable(),
  labelKey: z.string().nullable(),
});

export type AuditEncryptedField = z.infer<typeof auditEncryptedFieldSchema>;

export const auditEntrySchema = z.object({
  id: z.uuid(),
  occurredAt: z.iso.datetime(),
  actor: z.object({
    kind: z.enum(AUDIT_ACTOR_KINDS),
    // An admin's or the operator's email, a guardian's email, or null for the system or an erased identity.
    name: z.string().nullable(),
  }),
  ipAddress: z.string().nullable(),
  action: z.string(),
  target: auditTargetSchema,
  // Old and new values of plain fields; encrypted fields by name only.
  changes: z.record(z.string(), z.object({ old: z.unknown(), new: z.unknown() })).nullable(),
  encryptedFields: z.array(auditEncryptedFieldSchema),
});

export type AuditEntry = z.infer<typeof auditEntrySchema>;
