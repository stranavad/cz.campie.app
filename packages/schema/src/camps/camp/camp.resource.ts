import { z } from 'zod';

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

// A Camp as its settings show it. The contact is the reply address of its mail and what guardians see.
export const campSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  slug: z.string(),
  websiteUrl: z.string().nullable(),
  contactName: z.string().nullable(),
  contactEmail: z.string().nullable(),
  contactPhone: z.string().nullable(),
  modules: campModulesSchema,
});

export type Camp = z.infer<typeof campSchema>;

// A Camp as every admin of the Organisation sees it, for picking one.
export const campSummarySchema = campSchema.pick({ id: true, name: true, slug: true });

export type CampSummary = z.infer<typeof campSummarySchema>;

export const campParamsSchema = z.object({ campId: z.uuid() });

export type CampParams = z.infer<typeof campParamsSchema>;
