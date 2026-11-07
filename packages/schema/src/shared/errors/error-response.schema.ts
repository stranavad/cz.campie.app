import { z } from 'zod';

// One field's reason a request was refused, for a form to show at the field: where (as the request's
// path), an i18n code, and what the code's text needs.
export const fieldErrorSchema = z.object({
  path: z.array(z.union([z.string(), z.number()])).max(10),
  code: z.string(),
  params: z.record(z.string(), z.number()).optional(),
});

export type FieldError = z.infer<typeof fieldErrorSchema>;

export const errorResponseSchema = z.object({
  statusCode: z.number().int(),
  code: z.string().optional(),
  message: z.string(),
  // A refused form's reasons per field, so it keeps its data and shows them where they belong.
  fields: z.array(fieldErrorSchema).max(500).optional(),
});

export type ErrorResponse = z.infer<typeof errorResponseSchema>;

// Code of a request refused because its IP address or its target (an email, an Organisation) sent too many
// lately, which the app translates. Anonymous requests that send mail or create data (signup, password
// reset) answer it with 429 before doing anything.
export const REQUEST_LIMIT_ERROR_CODES = ['requests_throttled'] as const;

export type RequestLimitErrorCode = (typeof REQUEST_LIMIT_ERROR_CODES)[number];
