import { z } from 'zod';

import { publicCampParamsSchema } from '@repo/schema/camps';
import { answerValueSchema } from '@repo/schema/form-engine';
import { PAYMENT_CHOICES } from '@repo/schema/pricing';
import { defineEndpoint } from '@repo/schema/shared';

import { invoiceRequestBodySchema } from '../invoice-request/invoice-request.resource.ts';
import { registrationPaymentSchema } from '../registration-payment/registration-payment.resource.ts';

const answersSchema = z.record(z.string().max(100), answerValueSchema);

export const submitRegistrationBodySchema = z.object({
  // Made by the form once; the same key twice returns the first Registration.
  idempotencyKey: z.uuid(),
  turnusId: z.uuid(),
  // Checked by the server against the latest published form.
  submission: z.object({ registration: answersSchema, participants: z.array(answersSchema).min(1).max(20) }),
  paymentChoice: z.enum(PAYMENT_CHOICES),
  discountCode: z.string().trim().max(40).nullable(),
  // Each declaration of the form, ticked or not.
  declarations: z.array(z.object({ id: z.uuid(), accepted: z.boolean() })).max(50),
  // Part or all of the price invoiced to a company, while the Camp offers it; null for none.
  invoiceRequest: invoiceRequestBodySchema.nullable().default(null),
});

export type SubmitRegistrationBody = z.infer<typeof submitRegistrationBodySchema>;

export const submittedRegistrationSchema = z.object({
  id: z.uuid(),
  variableSymbol: z.string(),
  total: z.number().int(),
  // Owed first when the Deposit was chosen; null when paying in full.
  depositTotal: z.number().int().nullable(),
  // How to pay, as the portal shows it, so the guardian can pay before the email arrives.
  payment: registrationPaymentSchema,
});

export type SubmittedRegistration = z.infer<typeof submittedRegistrationSchema>;

// Codes of a refused submission, which the form translates. `submission_invalid` lists its reasons in
// `fields`; the Turnus ones no change to the answers fixes; `turnus_busy` asks to try again in a moment;
// `idempotency_key_reused` names a key that already created a Registration in another Turnus.
export const SUBMISSION_ERROR_CODES = [
  'submission_invalid',
  'idempotency_key_reused',
  'turnus_busy',
  'turnus_not_yet_open',
  'turnus_window_closed',
  'turnus_closed_manually',
  'turnus_full',
] as const;

export type SubmissionErrorCode = (typeof SUBMISSION_ERROR_CODES)[number];

// Field-level codes a submission adds to the form engine's: more children than the Camp allows, a child
// outside the age limits (at its birth date), an unticked mandatory declaration, and a code that cannot be
// used (at the code field), and an Invoice request the Camp does not offer or above the total.
export const SUBMISSION_FIELD_ERROR_CODES = [
  'participants_too_many',
  'participant_too_young',
  'participant_too_old',
  'declaration_required',
  'discount_code_expired',
  'discount_code_exhausted',
  'discount_code_inactive',
  'discount_code_unknown',
  'invoice_request_unavailable',
  'invoice_amount_above_total',
] as const;

export type SubmissionFieldErrorCode = (typeof SUBMISSION_FIELD_ERROR_CODES)[number];

// Creates a Registration with its Participants in the Turnus, without a session, from the subdomain of an
// approved Organisation. The place is taken now: the Turnus must be open and have room for every child.
// Rate limited per address and per Organisation.
export const submitRegistrationEndpoint = defineEndpoint({
  method: 'POST',
  path: '/public-camps/:slug/registrations',
  params: publicCampParamsSchema,
  body: submitRegistrationBodySchema,
  response: submittedRegistrationSchema,
});
