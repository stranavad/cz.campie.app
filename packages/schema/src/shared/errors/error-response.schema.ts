import { z } from 'zod';

export const errorResponseSchema = z.object({
  statusCode: z.number().int(),
  code: z.string().optional(),
  message: z.string(),
});

export type ErrorResponse = z.infer<typeof errorResponseSchema>;

// Code of a request refused because its IP address or its target (an email, an Organisation) sent too many
// lately, which the app translates. Anonymous requests that send mail or create data (signup, password
// reset) answer it with 429 before doing anything.
export const REQUEST_LIMIT_ERROR_CODES = ['requests_throttled'] as const;

export type RequestLimitErrorCode = (typeof REQUEST_LIMIT_ERROR_CODES)[number];
