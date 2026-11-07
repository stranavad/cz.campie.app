import { z } from 'zod';

import { campFieldsSchema, type Camp, type UpdateCampBody } from '@repo/schema/camps';
import { czkSchema } from '@repo/schema/shared';

// The contract's fields, every one present: the form saves the Camp whole. The Sibling discount is typed
// as text and checked as the contract's whole CZK.
export const campFormSchema = campFieldsSchema.extend({
  siblingDiscountAmount: z.string().refine((text) => czkSchema.safeParse(amountOf(text)).success, 'czk_invalid'),
});

export type CampFormValues = z.input<typeof campFormSchema>;

/**
 * Read a typed amount. A number input that holds something it cannot read reports it empty, so empty is
 * invalid rather than no discount; none is 0.
 * @param text the input's text
 */
function amountOf(text: string): number {
  return text.trim() === '' ? Number.NaN : Number(text);
}

/**
 * Turn checked inputs into the change the API takes.
 * @param values the inputs
 * @throws {ZodError} when the inputs break the contract's rules
 */
export function campChangeOf(values: CampFormValues): UpdateCampBody {
  return campFieldsSchema.parse({ ...values, siblingDiscountAmount: amountOf(values.siblingDiscountAmount) });
}

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
    siblingDiscountAmount: String(camp.siblingDiscountAmount),
    siblingDiscountAppliesTo: camp.siblingDiscountAppliesTo,
  };
}
