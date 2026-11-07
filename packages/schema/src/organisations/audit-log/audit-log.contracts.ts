import { z } from 'zod';

import { defineEndpoint } from '@repo/schema/shared';

export const AUDIT_ACTOR_KINDS = ['admin', 'guardian', 'operator', 'system'] as const;

export const auditLogEntrySchema = z.object({
  id: z.uuid(),
  occurredAt: z.iso.datetime(),
  actor: z.object({
    kind: z.enum(AUDIT_ACTOR_KINDS),
    // An admin's or the operator's email, a guardian's email, or null for the system or an erased identity.
    name: z.string().nullable(),
  }),
  ipAddress: z.string().nullable(),
  action: z.string(),
  target: z.object({ type: z.string(), id: z.uuid() }),
  // Old and new values of plain fields; encrypted fields by name only.
  changes: z.record(z.string(), z.object({ old: z.unknown(), new: z.unknown() })).nullable(),
  encryptedFields: z.array(z.string()),
});

export type AuditLogEntry = z.infer<typeof auditLogEntrySchema>;

export const auditLogQuerySchema = z.object({
  actorKind: z.enum(AUDIT_ACTOR_KINDS).optional(),
  // An admin's or a guardian's email.
  actor: z.string().trim().toLowerCase().max(254).optional(),
  // An action, or the start of one (`consent.` for every Consent action).
  action: z.string().trim().max(100).optional(),
  targetType: z.string().trim().max(100).optional(),
  targetId: z.uuid().optional(),
  from: z.iso.datetime().optional(),
  to: z.iso.datetime().optional(),
  // The last entry of the previous page.
  after: z.uuid().optional(),
});

export type AuditLogQuery = z.infer<typeof auditLogQuerySchema>;

export const auditLogPageSchema = z.object({
  entries: z.array(auditLogEntrySchema),
  // Asks for the next page; null on the last one.
  next: z.uuid().nullable(),
});

export type AuditLogPage = z.infer<typeof auditLogPageSchema>;

// The Organisation's whole audit log, newest first, filtered, a page at a time; Owners only.
export const listAuditLogEndpoint = defineEndpoint({
  method: 'GET',
  path: '/audit-log',
  query: auditLogQuerySchema,
  response: auditLogPageSchema,
});
