import { z } from 'zod';

export const errorResponseSchema = z.object({
  statusCode: z.number().int(),
  code: z.string().optional(),
  message: z.string(),
});

export type ErrorResponse = z.infer<typeof errorResponseSchema>;
