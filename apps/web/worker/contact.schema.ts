import { z } from 'zod';

// Field lengths, shared with the form on /kontakt so the browser and the Worker agree.
export const contactLimits = {
  name: { min: 1, max: 100 },
  organisation: { max: 150 },
  email: { max: 254 },
  message: { min: 10, max: 5000 },
} as const;

// The honeypot field: hidden from people, so only a bot fills it in.
export const honeypotField = 'web';

// The contact form's fields, as the form on /kontakt names them.
export const contactSchema = z.object({
  name: z.string().trim().min(contactLimits.name.min).max(contactLimits.name.max),
  organisation: z.string().trim().max(contactLimits.organisation.max).default(''),
  email: z.string().trim().max(contactLimits.email.max).pipe(z.email()),
  message: z.string().trim().min(contactLimits.message.min).max(contactLimits.message.max),
  'cf-turnstile-response': z.string().min(1).max(2048),
});

export type ContactMessage = z.infer<typeof contactSchema>;
