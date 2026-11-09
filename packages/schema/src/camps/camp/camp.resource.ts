import { z } from 'zod';

import { SIBLING_DISCOUNT_MODES } from '@repo/schema/pricing';

// What a Camp can switch on or off. Switching one off hides it and keeps its data.
export const CAMP_MODULES = [
  'consents',
  'documents',
  'generatedDocuments',
  'healthRecord',
  'campHealthLog',
  'oddily',
  'vedouci',
] as const;

export type CampModule = (typeof CAMP_MODULES)[number];

export const campModulesSchema = z.object(
  Object.fromEntries(CAMP_MODULES.map((module) => [module, z.boolean()])) as Record<CampModule, z.ZodBoolean>,
);

export type CampModules = z.infer<typeof campModulesSchema>;

export const MAX_CAMP_DESCRIPTION_LENGTH = 1000;

// A Camp as its settings show it. The contact is the reply address of its mail and what guardians see.
export const campSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  slug: z.string(),
  websiteUrl: z.string().nullable(),
  description: z.string().nullable(),
  contactName: z.string().nullable(),
  contactEmail: z.string().nullable(),
  contactPhone: z.string().nullable(),
  modules: campModulesSchema,
  // Per child in whole CZK, 0 for none.
  siblingDiscountAmount: z.number().int(),
  siblingDiscountAppliesTo: z.enum(SIBLING_DISCOUNT_MODES),
  // Who in the Camp's team hears of each new Registration.
  notificationEmails: z.array(z.string()),
  // Until this Prague date, inclusive, guardians may edit contact details and fill new form fields.
  contactEditLockDate: z.iso.date().nullable(),
});

export type Camp = z.infer<typeof campSchema>;

// A Camp as every admin of the Organisation sees it, for picking one.
export const campSummarySchema = campSchema.pick({ id: true, name: true, slug: true });

export type CampSummary = z.infer<typeof campSummarySchema>;

export const campParamsSchema = z.object({ campId: z.uuid() });

export type CampParams = z.infer<typeof campParamsSchema>;
