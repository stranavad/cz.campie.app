import { z } from 'zod';

import { ORGANISATION_STATUSES } from '@repo/schema/organisations';

// An Organisation as the Platform operator's console shows it: its identity and status, nothing it holds.
export const consoleOrganisationSchema = z.object({
  id: z.uuid(),
  subdomain: z.string(),
  status: z.enum(ORGANISATION_STATUSES),
  displayName: z.string(),
  legalName: z.string(),
  ico: z.string(),
  vatId: z.string().nullable(),
  address: z.string(),
  statutoryRepresentative: z.string(),
  contactEmail: z.string(),
  contactPhone: z.string(),
  // Its mail so far, without a single address: messages sent, and bounce and complaint notifications.
  mail: z.object({ sent: z.number().int(), bounced: z.number().int(), complained: z.number().int() }),
});

export type ConsoleOrganisation = z.infer<typeof consoleOrganisationSchema>;

export const consoleOrganisationParamsSchema = z.object({ organisationId: z.uuid() });

export type ConsoleOrganisationParams = z.infer<typeof consoleOrganisationParamsSchema>;

// Codes of a console action refused for the Organisation's status, which the app translates.
export const CONSOLE_ERROR_CODES = ['organisation_not_pending', 'organisation_not_approved'] as const;

export type ConsoleErrorCode = (typeof CONSOLE_ERROR_CODES)[number];
