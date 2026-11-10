import { z } from 'zod';

// The contact form's fields, as the form on /kontakt names them.
export const contactSchema = z.object({
  name: z.string().trim().min(1).max(100),
  organisation: z.string().trim().max(150).default(''),
  email: z.string().trim().max(254).pipe(z.email()),
  message: z.string().trim().min(10).max(5000),
  'cf-turnstile-response': z.string().min(1).max(2048),
});

export type ContactMessage = z.infer<typeof contactSchema>;
