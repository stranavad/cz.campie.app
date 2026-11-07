import { z } from 'zod';

import { createDiscountCodeBodySchema, type CreateDiscountCodeBody } from '@repo/schema/camps';
import { DISCOUNT_CODE_KINDS } from '@repo/schema/pricing';

// What the inputs hold, as typed; checked by the contract's rules at the same fields.
const discountCodeInputSchema = z.object({
  code: z.string(),
  kind: z.enum(DISCOUNT_CODE_KINDS),
  value: z.string(),
  usageLimit: z.string(),
  expiresOn: z.string(),
});

export type DiscountCodeFormValues = z.input<typeof discountCodeInputSchema>;

export const DISCOUNT_CODE_FORM_DEFAULTS: DiscountCodeFormValues = {
  code: '',
  kind: 'percentage',
  value: '',
  usageLimit: '',
  expiresOn: '',
};

/**
 * Read the inputs as the contract's code, unchecked.
 * @param values the inputs
 */
function asBody(values: DiscountCodeFormValues) {
  return {
    ...values,
    value: values.value.trim() === '' ? Number.NaN : Number(values.value),
    usageLimit: values.usageLimit.trim() === '' ? null : Number(values.usageLimit),
    expiresOn: values.expiresOn === '' ? null : values.expiresOn,
  };
}

export const discountCodeFormSchema = discountCodeInputSchema.superRefine((values, context) => {
  for (const issue of createDiscountCodeBodySchema.safeParse(asBody(values)).error?.issues ?? []) {
    context.addIssue({ code: 'custom', path: issue.path, message: issue.message });
  }
});

/**
 * Turn checked inputs into the code the API takes.
 * @param values the inputs
 * @throws {ZodError} when the inputs break the contract's rules
 */
export function discountCodeBodyOf(values: DiscountCodeFormValues): CreateDiscountCodeBody {
  return createDiscountCodeBodySchema.parse(asBody(values));
}
