import { z } from 'zod';

import { SIBLING_DISCOUNT_MODES } from '@repo/schema/pricing';
import { czkSchema, defineEndpoint, emailSchema, phoneSchema, requiredText } from '@repo/schema/shared';

import { campSlugSchema } from './camp-slug.ts';
import { campModulesSchema, campSchema } from './camp.resource.ts';

// Empty means none.
const optional = <T extends z.ZodType<string | null>>(schema: T) =>
  z.union([z.literal('').transform(() => null), z.null(), schema]);

// Every field of a Camp an admin sets; create takes its identity and contact, update any of them.
export const campFieldsSchema = z.object({
  name: requiredText(120),
  slug: campSlugSchema,
  // Shown to guardians; https or http only, so it cannot run script.
  websiteUrl: optional(z.url({ protocol: /^https?$/ }).max(300)),
  contactName: optional(requiredText(120)),
  contactEmail: optional(emailSchema),
  contactPhone: optional(phoneSchema),
  modules: campModulesSchema,
  siblingDiscountAmount: czkSchema,
  siblingDiscountAppliesTo: z.enum(SIBLING_DISCOUNT_MODES),
});

export const createCampBodySchema = campFieldsSchema.omit({
  modules: true,
  siblingDiscountAmount: true,
  siblingDiscountAppliesTo: true,
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
