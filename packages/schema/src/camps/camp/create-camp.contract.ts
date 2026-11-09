import { z } from 'zod';

import { SIBLING_DISCOUNT_MODES } from '@repo/schema/pricing';
import {
  calendarDateSchema,
  czkSchema,
  defineEndpoint,
  emailSchema,
  multilineText,
  phoneSchema,
  requiredText,
} from '@repo/schema/shared';

import { campSlugSchema } from './camp-slug.ts';
import { campModulesSchema, campSchema, MAX_CAMP_DESCRIPTION_LENGTH } from './camp.resource.ts';

// Empty means none.
const optional = <T extends z.ZodType<string | null>>(schema: T) =>
  z.union([z.literal('').transform(() => null), z.null(), schema]);

// Every field of a Camp an admin sets; create takes its identity and contact, update any of them.
export const campFieldsSchema = z.object({
  name: requiredText(120),
  slug: campSlugSchema,
  // Shown to guardians; https or http only, so it cannot run script.
  websiteUrl: optional(z.url({ protocol: /^https?$/ }).max(300)),
  // What guardians read about the Camp: plain text, never markup, a few paragraphs at most.
  description: z.union([z.null(), multilineText(MAX_CAMP_DESCRIPTION_LENGTH).transform((text) => text || null)]),
  contactName: optional(requiredText(120)),
  contactEmail: optional(emailSchema),
  contactPhone: optional(phoneSchema),
  modules: campModulesSchema,
  siblingDiscountAmount: czkSchema,
  siblingDiscountAppliesTo: z.enum(SIBLING_DISCOUNT_MODES),
  notificationEmails: z
    .array(emailSchema)
    .max(10)
    .refine((emails) => new Set(emails).size === emails.length, 'notification_email_duplicate'),
  contactEditLockDate: calendarDateSchema.nullable(),
});

export const createCampBodySchema = campFieldsSchema.omit({
  description: true,
  modules: true,
  siblingDiscountAmount: true,
  siblingDiscountAppliesTo: true,
  notificationEmails: true,
  contactEditLockDate: true,
});

export type CreateCampBody = z.infer<typeof createCampBodySchema>;

// Adds a Camp to the current Organisation, every module off and no Sibling discount; Camp settings write.
// A taken slug answers camp_slug_taken.
export const createCampEndpoint = defineEndpoint({
  method: 'POST',
  path: '/camps',
  body: createCampBodySchema,
  response: campSchema,
});
