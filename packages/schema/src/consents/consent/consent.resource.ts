import { z } from 'zod';

import { fileLinkSchema } from '@repo/schema/files';

// What an item asks of the signer: nothing (information only), agreement it cannot refuse, or a free
// yes or no.
export const CONSENT_ITEM_KINDS = ['information', 'must_agree', 'yes_no'] as const;

export type ConsentItemKind = (typeof CONSENT_ITEM_KINDS)[number];

export const consentItemSchema = z.object({
  // Stable across versions, so answers name the item they answer.
  id: z.uuid(),
  kind: z.enum(CONSENT_ITEM_KINDS),
  text: z.string().trim().min(1).max(5000),
});

export type ConsentItem = z.infer<typeof consentItemSchema>;

// What an admin writes; each save of a Consent publishes it as a new version.
export const consentContentSchema = z.object({
  title: z.string().trim().min(1).max(200),
  introduction: z.string().trim().max(10_000),
  items: z
    .array(consentItemSchema)
    .min(1)
    .max(50)
    .refine((items) => new Set(items.map(({ id }) => id)).size === items.length, 'consent_item_ids_repeat'),
  withdrawable: z.boolean(),
  // A PDF uploaded for the Camp's Consents, or none.
  fileId: z.uuid().nullable(),
});

export type ConsentContent = z.infer<typeof consentContentSchema>;

export const consentVersionSchema = z.object({
  id: z.uuid(),
  version: z.number().int(),
  title: z.string(),
  introduction: z.string(),
  items: z.array(consentItemSchema),
  withdrawable: z.boolean(),
  // The attached PDF with its SHA-256, hex; the link lasts a few minutes.
  file: z.object({ id: z.uuid(), sha256: z.string(), link: fileLinkSchema }).nullable(),
  publishedAt: z.iso.datetime(),
});

export type ConsentVersion = z.infer<typeof consentVersionSchema>;

// A Consent with every version it had, newest first.
export const consentSchema = z.object({
  id: z.uuid(),
  campId: z.uuid(),
  versions: z.array(consentVersionSchema),
});

export type Consent = z.infer<typeof consentSchema>;

export const consentSummarySchema = z.object({
  id: z.uuid(),
  title: z.string(),
  version: z.number().int(),
  withdrawable: z.boolean(),
  publishedAt: z.iso.datetime(),
});

export type ConsentSummary = z.infer<typeof consentSummarySchema>;
