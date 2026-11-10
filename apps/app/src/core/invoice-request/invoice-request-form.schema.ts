import { formOptions } from '@tanstack/react-form';
import { z } from 'zod';

import { invoiceRequestBodySchema, type InvoiceRequest, type InvoiceRequestBody } from '@repo/schema/registrations';

/**
 * Check the typed Invoice request against the contract and the total it may not exceed.
 * @param total the Registration's total now
 */
export function invoiceRequestFormSchema(total: number) {
  return invoiceRequestBodySchema.extend({
    amount: z
      .string()
      .transform((text) => text.replaceAll(/\s/g, ''))
      .refine((text) => /^\d+$/.test(text), 'invoice_amount_zero')
      .transform(Number)
      .pipe(invoiceRequestBodySchema.shape.amount.max(total, 'invoice_amount_above_total')),
  });
}

// The company's details as typed, the amount as text; empty optional fields are none.
export type InvoiceRequestFormValues = z.input<ReturnType<typeof invoiceRequestFormSchema>>;

const BLANK: InvoiceRequestFormValues = {
  companyName: '',
  ico: '',
  dic: '',
  street: '',
  city: '',
  postcode: '',
  email: '',
  note: '',
  amount: '',
};

export const invoiceRequestFormOptions = formOptions({ defaultValues: BLANK });

/**
 * Turn checked inputs into the Invoice request the API takes.
 * @param values the inputs
 * @param total the Registration's total now
 * @returns the Invoice request, or null when the inputs do not check out
 */
export function invoiceRequestBodyOf(values: InvoiceRequestFormValues, total: number): InvoiceRequestBody | null {
  const parsed = invoiceRequestFormSchema(total).safeParse(values);

  return parsed.success ? parsed.data : null;
}

/**
 * Fill the form from a saved Invoice request, or blank with the amount at the total.
 * @param saved the Invoice request, or null
 * @param total the Registration's total now
 */
export function invoiceRequestFormValues(saved: InvoiceRequest | null, total: number): InvoiceRequestFormValues {
  return saved === null
    ? { ...BLANK, amount: String(total) }
    : {
        companyName: saved.companyName,
        ico: saved.ico,
        dic: saved.dic ?? '',
        street: saved.street,
        city: saved.city,
        postcode: saved.postcode,
        email: saved.email ?? '',
        note: saved.note ?? '',
        amount: String(saved.amount),
      };
}
