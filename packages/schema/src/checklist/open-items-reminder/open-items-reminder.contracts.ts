import { z } from 'zod';

import { defineEndpoint } from '@repo/schema/shared';

export const openItemsReminderParamsSchema = z.object({ turnusId: z.uuid() });

export type OpenItemsReminderParams = z.infer<typeof openItemsReminderParamsSchema>;

// How many Registrations of a Turnus have an open item other than payment, before the admin confirms.
export const openItemsReminderPreviewSchema = z.object({
  registrations: z.number().int(),
  // Whether the Camp sends its open-items reminder at all.
  enabled: z.boolean(),
});

export type OpenItemsReminderPreview = z.infer<typeof openItemsReminderPreviewSchema>;

// Registrations write.
export const previewOpenItemsReminderEndpoint = defineEndpoint({
  method: 'GET',
  path: '/turnusy/:turnusId/open-items-reminders',
  params: openItemsReminderParamsSchema,
  response: openItemsReminderPreviewSchema,
});

export const openItemsRemindersSentSchema = z.object({ reminded: z.number().int() });

export type OpenItemsRemindersSent = z.infer<typeof openItemsRemindersSentSchema>;

// `open_items_reminder_switched_off`: the Camp switched its open-items reminder off, so nothing was sent.
export const OPEN_ITEMS_REMINDER_ERROR_CODES = ['open_items_reminder_switched_off'] as const;

export type OpenItemsReminderErrorCode = (typeof OPEN_ITEMS_REMINDER_ERROR_CODES)[number];

// Reminds both guardians of every Registration of the Turnus with an open item other than payment, each
// email listing what is open per child, from jobs; audited; limited per Organisation. Registrations write.
export const sendOpenItemsReminderEndpoint = defineEndpoint({
  method: 'POST',
  path: '/turnusy/:turnusId/open-items-reminders',
  params: openItemsReminderParamsSchema,
  response: openItemsRemindersSentSchema,
});
