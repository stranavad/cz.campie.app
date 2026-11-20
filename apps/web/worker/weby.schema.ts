import { z } from 'zod';

import { websitePattern, webyLimits } from './weby.fields.ts';

// The form on /weby-pro-tabory: the address of the camp's current website and the organiser's e-mail.
export const webySchema = z.object({
  url: z.string().trim().max(webyLimits.url.max).regex(websitePattern),
  email: z.string().trim().max(webyLimits.email.max).pipe(z.email()),
  'cf-turnstile-response': z.string().min(1).max(2048),
});

export type WebyRequest = z.infer<typeof webySchema>;
