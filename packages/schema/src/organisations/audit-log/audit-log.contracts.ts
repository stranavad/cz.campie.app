import { z } from 'zod';

import { AUDIT_ACTOR_KINDS, AUDIT_AREAS, auditEntrySchema } from '@repo/schema/audit';
import { defineEndpoint } from '@repo/schema/shared';

export const auditLogQuerySchema = z.object({
  actorKind: z.enum(AUDIT_ACTOR_KINDS).optional(),
  // An admin's or a guardian's email.
  actor: z.string().trim().toLowerCase().max(254).optional(),
  // The area of the actions, such as every action on Turnusy.
  area: z.enum(AUDIT_AREAS).optional(),
  targetType: z.string().trim().max(100).optional(),
  targetId: z.uuid().optional(),
  from: z.iso.datetime().optional(),
  to: z.iso.datetime().optional(),
  // The last entry of the previous page.
  after: z.uuid().optional(),
});

export type AuditLogQuery = z.infer<typeof auditLogQuerySchema>;

export const auditLogPageSchema = z.object({
  // Each with its record named as it is now.
  entries: z.array(auditEntrySchema),
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
