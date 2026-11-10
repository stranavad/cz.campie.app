import { z } from 'zod';

import {
  adminInvoiceRequestBodySchema,
  invoiceRequestFieldsSchema,
  type AdminInvoiceRequestBody,
  type InvoiceRequest,
} from '@repo/schema/registrations';
import { calendarDateSchema } from '@repo/schema/shared';

import type { InvoiceRequestFormValues } from '@/core/invoice-request';

// The company and amount as an admin saves them: any whole amount from zero, whatever the total.
export const adminBillingFormSchema = invoiceRequestFieldsSchema.extend({
  amount: z
    .string()
    .transform((text) => text.replaceAll(/\s/g, ''))
    .refine((text) => /^\d+$/.test(text), 'czk_invalid')
    .transform(Number)
    .pipe(adminInvoiceRequestBodySchema.shape.amount),
});

// The camp's state of the invoice: its date and number, or neither while it is still to invoice.
export const invoiceStateFormSchema = z.object({
  invoicedOn: z.union([z.literal('').transform(() => null), calendarDateSchema]),
  invoiceNumber: adminInvoiceRequestBodySchema.shape.invoiceNumber,
});

export type InvoiceStateFormValues = z.input<typeof invoiceStateFormSchema>;

type State = Pick<AdminInvoiceRequestBody, 'invoicedOn' | 'invoiceNumber'>;

/**
 * Turn the company and amount as typed into the Invoice request the API takes, keeping its state.
 * @param values the inputs
 * @param state the saved state, or none for a new Invoice request
 * @returns the Invoice request, or null when the inputs do not check out
 */
export function billingBodyOf(values: InvoiceRequestFormValues, state: State): AdminInvoiceRequestBody | null {
  const parsed = adminBillingFormSchema.safeParse(values);

  return parsed.success ? { ...parsed.data, ...state } : null;
}

/**
 * Turn the state as typed into the Invoice request the API takes, keeping its company and amount.
 * @param values the inputs
 * @param saved the saved Invoice request
 * @returns the Invoice request, or null when the inputs do not check out
 */
export function stateBodyOf(values: InvoiceStateFormValues, saved: InvoiceRequest): AdminInvoiceRequestBody | null {
  const parsed = invoiceStateFormSchema.safeParse(values);

  return parsed.success ? { ...saved, ...parsed.data } : null;
}

/**
 * Fill the state from a saved Invoice request, today's date offered when it has none.
 * @param saved the Invoice request
 * @param today the Prague calendar date today
 */
export function stateFormValues(saved: InvoiceRequest | null, today: string): InvoiceStateFormValues {
  return { invoicedOn: saved?.invoicedOn ?? today, invoiceNumber: saved?.invoiceNumber ?? '' };
}
