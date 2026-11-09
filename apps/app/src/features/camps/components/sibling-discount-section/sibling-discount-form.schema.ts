import { z } from 'zod';

import type { Camp, UpdateCampBody } from '@repo/schema/camps';
import { SIBLING_DISCOUNT_MODES } from '@repo/schema/pricing';
import { czkSchema } from '@repo/schema/shared';

/**
 * Read a typed amount. A number input that holds something it cannot read reports it empty, so empty is
 * invalid rather than no discount.
 * @param text the input's text
 */
function amountOf(text: string): number {
  return text.trim() === '' ? Number.NaN : Number(text);
}

// The Sibling discount switched on with its amount per child in whole CZK; switched off it is 0, which the
// Camp stores as none.
export const siblingDiscountFormSchema = z
  .object({ enabled: z.boolean(), amount: z.string(), appliesTo: z.enum(SIBLING_DISCOUNT_MODES) })
  .superRefine(({ enabled, amount }, context) => {
    if (enabled && !czkSchema.safeParse(amountOf(amount)).success) {
      context.addIssue({ code: 'custom', path: ['amount'], message: 'czk_invalid' });
    }
  });

export type SiblingDiscountFormValues = z.input<typeof siblingDiscountFormSchema>;

/**
 * Turn checked inputs into the change the API takes.
 * @param values the inputs
 */
export function siblingDiscountChangeOf({ enabled, amount, appliesTo }: SiblingDiscountFormValues): UpdateCampBody {
  return { siblingDiscountAmount: enabled ? amountOf(amount) : 0, siblingDiscountAppliesTo: appliesTo };
}

/**
 * Fill the form from the saved Camp.
 * @param camp the Camp
 */
export function siblingDiscountFormValues(camp: Camp): SiblingDiscountFormValues {
  return {
    enabled: camp.siblingDiscountAmount > 0,
    amount: camp.siblingDiscountAmount > 0 ? String(camp.siblingDiscountAmount) : '',
    appliesTo: camp.siblingDiscountAppliesTo,
  };
}
