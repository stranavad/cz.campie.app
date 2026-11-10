import { z } from 'zod';

import { fileLinkSchema } from '@repo/schema/files';
import { icoSchema, vatIdSchema } from '@repo/schema/organisations';
import { calendarDateSchema, czkSchema, emailSchema } from '@repo/schema/shared';

// Empty means none.
const optional = <T extends z.ZodType<string | null>>(schema: T) =>
  z.union([z.literal('').transform(() => null), z.null(), schema]);

// Named by a code, so the API reports a missing one at its field.
const required = (max: number) => z.string().trim().min(1, 'invoice_field_required').max(max);

// The company's billing details an Invoice request carries; spaces in the numbers are dropped.
export const invoiceRequestFieldsSchema = z.object({
  companyName: required(200),
  ico: icoSchema,
  dic: vatIdSchema,
  street: required(200),
  city: required(100),
  postcode: z
    .string()
    .transform((value) => value.replaceAll(/\s/g, ''))
    .refine((value) => /^\d{5}$/.test(value), 'postcode_invalid'),
  email: optional(emailSchema),
  // A note or the company's order number, for the invoice.
  note: optional(required(500)),
});

export type InvoiceRequestFields = z.infer<typeof invoiceRequestFieldsSchema>;

// What a guardian asks to invoice: the company and the amount, more than zero and at most the total, which
// the server checks against the Registration's total.
export const invoiceRequestBodySchema = invoiceRequestFieldsSchema.extend({
  amount: czkSchema.min(1, 'invoice_amount_zero'),
});

export type InvoiceRequestBody = z.infer<typeof invoiceRequestBodySchema>;

// An Invoice request as its Registration shows it, with whether the camp has invoiced it.
export const invoiceRequestSchema = invoiceRequestFieldsSchema.extend({
  amount: z.number().int(),
  // Prague calendar date the camp invoiced it; until then the guardian may change it.
  invoicedOn: calendarDateSchema.nullable(),
  invoiceNumber: z.string().nullable(),
});

export type InvoiceRequest = z.infer<typeof invoiceRequestSchema>;

// What an admin saves: the company, any amount from zero, and the state, set or cleared at any time.
export const adminInvoiceRequestBodySchema = invoiceRequestFieldsSchema.extend({
  amount: czkSchema,
  invoicedOn: calendarDateSchema.nullable(),
  invoiceNumber: optional(z.string().trim().max(100)),
});

export type AdminInvoiceRequestBody = z.infer<typeof adminInvoiceRequestBodySchema>;

// An invoice or corrective document the camp uploaded to an Invoice request, with a short-lived link.
export const invoiceFileSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  uploadedAt: z.iso.datetime(),
  file: fileLinkSchema,
});

export type InvoiceFile = z.infer<typeof invoiceFileSchema>;

// Where an Invoice request stands: still to invoice (no date yet) or invoiced.
export const INVOICE_STATES = ['to_invoice', 'invoiced'] as const;

export type InvoiceState = (typeof INVOICE_STATES)[number];

/**
 * Tell where an Invoice request stands.
 * @param invoiceRequest its date of invoicing
 */
export function invoiceStateOf({ invoicedOn }: { invoicedOn: string | null }): InvoiceState {
  return invoicedOn === null ? 'to_invoice' : 'invoiced';
}

// Why an Invoice request was refused: the Camp does not offer one, the amount is above the total (at the
// amount field), the camp has invoiced it already, or it holds invoice files, which are never removed.
export const INVOICE_REQUEST_ERROR_CODES = [
  'invoice_request_unavailable',
  'invoice_amount_above_total',
  'invoice_request_invoiced',
  'invoice_request_has_files',
] as const;

export type InvoiceRequestErrorCode = (typeof INVOICE_REQUEST_ERROR_CODES)[number];
