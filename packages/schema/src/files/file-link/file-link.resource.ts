import { z } from 'zod';

// A short-lived link to open one file; it works without a session until it expires.
export const fileLinkSchema = z.object({
  url: z.string(),
  expiresAt: z.iso.datetime(),
});

export type FileLink = z.infer<typeof fileLinkSchema>;
