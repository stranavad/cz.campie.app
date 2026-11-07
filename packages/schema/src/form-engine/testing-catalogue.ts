import { z } from 'zod';

import type { StandardFieldCatalogue } from './definition/form-definition.ts';

// A small catalogue for the engine's tests; the platform's own comes with the standard field catalogue.
export const TEST_CATALOGUE: StandardFieldCatalogue = {
  insurer: { scope: 'participant', labelKey: 'form.standard.insurer', schema: z.enum(['111', '201', '205']) },
  boardingPlace: { scope: 'registration', labelKey: 'form.standard.boardingPlace', schema: z.string().min(1).max(100) },
};
