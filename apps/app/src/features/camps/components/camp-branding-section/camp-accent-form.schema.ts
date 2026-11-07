import { z } from 'zod';

import { accentColourSchema } from '@repo/schema/organisations';

// The Camp's own colour, or none to wear the Organisation's.
export const campAccentFormSchema = z
  .object({ ownColour: z.boolean(), accentColour: z.string() })
  .superRefine(({ ownColour, accentColour }, context) => {
    if (ownColour && !accentColourSchema.safeParse(accentColour).success) {
      context.addIssue({ code: 'custom', path: ['accentColour'], message: 'accent_colour_invalid' });
    }
  });

export type CampAccentFormValues = z.input<typeof campAccentFormSchema>;
