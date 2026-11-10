import { z } from 'zod';

import { SIBLING_DISCOUNT_MODES } from '@repo/schema/pricing';
import { defineEndpoint } from '@repo/schema/shared';

export const publicCampParamsSchema = z.object({ slug: z.string().max(100) });

export type PublicCampParams = z.infer<typeof publicCampParamsSchema>;

// A Camp of the subdomain's Organisation as its public pages show it, with the branding they wear. Found
// by its slug or a former one; `slug` is the current one, so a page reached by a former one can move.
export const publicCampSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  slug: z.string(),
  websiteUrl: z.string().nullable(),
  // Plain text in paragraphs, shown as text.
  description: z.string().nullable(),
  // Whom guardians ask, shown with any problem the form cannot solve itself.
  contactName: z.string().nullable(),
  contactEmail: z.string(),
  contactPhone: z.string().nullable(),
  accentColour: z.string(),
  logoUrl: z.string().nullable(),
  // The Camp's photo for its card and the top of its page, served like the logo on the subdomain.
  photoUrl: z.string().nullable(),
  // Whether the Organisation takes card payments, so the form offers the choice.
  cardPayments: z.boolean(),
  // Whether the form offers an Invoice request.
  invoiceRequests: z.boolean(),
  // Per child in whole CZK, null when the Camp has none; the form shows it before a sibling is added, the
  // price preview gives the lines.
  siblingDiscount: z.object({ amount: z.number().int(), appliesTo: z.enum(SIBLING_DISCOUNT_MODES) }).nullable(),
});

export type PublicCamp = z.infer<typeof publicCampSchema>;

export const getPublicCampEndpoint = defineEndpoint({
  method: 'GET',
  path: '/public-camps/:slug',
  params: publicCampParamsSchema,
  response: publicCampSchema,
});
