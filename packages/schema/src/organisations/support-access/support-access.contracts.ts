import { z } from 'zod';

import { defineEndpoint } from '@repo/schema/shared';

// A time-limited grant letting the Platform operator into the Organisation for support.
export const supportGrantSchema = z.object({
  id: z.uuid(),
  allowWrites: z.boolean(),
  grantedAt: z.iso.datetime(),
  expiresAt: z.iso.datetime(),
  revokedAt: z.iso.datetime().nullable(),
  // In force now: neither expired nor revoked.
  active: z.boolean(),
});

export type SupportGrant = z.infer<typeof supportGrantSchema>;

// The Organisation's support grants, newest first; Owners only.
export const listSupportGrantsEndpoint = defineEndpoint({
  method: 'GET',
  path: '/support-access',
  response: z.array(supportGrantSchema),
});

// At most a week.
export const SUPPORT_GRANT_MAX_HOURS = 168;

export const grantSupportAccessBodySchema = z.object({
  hours: z.number().int().min(1).max(SUPPORT_GRANT_MAX_HOURS),
  // Read-only unless changes are allowed.
  allowWrites: z.boolean().default(false),
});

export type GrantSupportAccessBody = z.infer<typeof grantSupportAccessBodySchema>;

// Grants the Platform operator support access for some hours, ending any grant in force; audited; Owners only.
export const grantSupportAccessEndpoint = defineEndpoint({
  method: 'POST',
  path: '/support-access',
  body: grantSupportAccessBodySchema,
  response: supportGrantSchema,
});

export const supportGrantParamsSchema = z.object({ grantId: z.uuid() });

export type SupportGrantParams = z.infer<typeof supportGrantParamsSchema>;

// Ends a grant at once; audited; Owners only.
export const revokeSupportAccessEndpoint = defineEndpoint({
  method: 'DELETE',
  path: '/support-access/:grantId',
  params: supportGrantParamsSchema,
  response: supportGrantSchema,
});

// The Platform operator entering the Organisation under a grant, audited in its log; any member's route.
export const enterSupportAccessEndpoint = defineEndpoint({
  method: 'POST',
  path: '/support-access/enter',
});
