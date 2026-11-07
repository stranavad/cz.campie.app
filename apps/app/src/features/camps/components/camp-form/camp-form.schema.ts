import type { z } from 'zod';

import { campFieldsSchema, type Camp } from '@repo/schema/camps';

// The contract's fields, every one present: the form saves the Camp whole.
export const campFormSchema = campFieldsSchema;

export type CampFormValues = z.input<typeof campFormSchema>;

/**
 * Fill the form from the saved Camp.
 * @param camp the Camp
 */
export function campFormValues(camp: Camp): CampFormValues {
  return {
    name: camp.name,
    slug: camp.slug,
    websiteUrl: camp.websiteUrl ?? '',
    contactName: camp.contactName ?? '',
    contactEmail: camp.contactEmail ?? '',
    contactPhone: camp.contactPhone ?? '',
    modules: camp.modules,
  };
}
