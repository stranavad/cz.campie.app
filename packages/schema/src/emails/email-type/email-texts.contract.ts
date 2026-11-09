import { z } from 'zod';

import { defineEndpoint } from '@repo/schema/shared';

import { EMAIL_PLACEHOLDERS, EMAIL_TYPES } from './email-types.ts';

// A Camp's email of one type: its subject and text, its own or the platform's default, and whether it is
// sent.
export const campEmailTextSchema = z.object({
  type: z.enum(EMAIL_TYPES),
  subject: z.string(),
  text: z.string(),
  enabled: z.boolean(),
  // Whether the Camp wrote its own, rather than using the platform's default.
  customised: z.boolean(),
  canSwitchOff: z.boolean(),
  placeholders: z.array(z.enum(EMAIL_PLACEHOLDERS)),
});

export type CampEmailText = z.infer<typeof campEmailTextSchema>;

export const campEmailTextParamsSchema = z.object({ campId: z.uuid(), type: z.enum(EMAIL_TYPES) });

export type CampEmailTextParams = z.infer<typeof campEmailTextParamsSchema>;

export const campEmailTextBodySchema = z.object({
  // One line: it becomes a mail header.
  subject: z
    .string()
    .trim()
    .min(1)
    .max(200)
    .refine((subject) => !/[\r\n]/.test(subject), 'email_subject_one_line'),
  text: z.string().trim().min(1).max(10_000),
  enabled: z.boolean(),
});

export type CampEmailTextBody = z.infer<typeof campEmailTextBodySchema>;

// Codes of a refused text: a placeholder the type does not offer (the form names them with
// unknownPlaceholders); switching off the login link.
export const EMAIL_TEXT_ERROR_CODES = ['email_placeholders_unknown', 'email_type_required'] as const;

export type EmailTextErrorCode = (typeof EMAIL_TEXT_ERROR_CODES)[number];

// A Camp's emails, one per type in their fixed order; Camp settings read.
export const listCampEmailTextsEndpoint = defineEndpoint({
  method: 'GET',
  path: '/camps/:campId/email-texts',
  params: z.object({ campId: z.uuid() }),
  response: z.array(campEmailTextSchema),
});

// Saves a Camp's own subject and text of a type and whether it is sent, audited; Camp settings write.
export const saveCampEmailTextEndpoint = defineEndpoint({
  method: 'PUT',
  path: '/camps/:campId/email-texts/:type',
  params: campEmailTextParamsSchema,
  body: campEmailTextBodySchema,
  response: campEmailTextSchema,
});

// Returns a type to the platform's default wording, sent, audited; Camp settings write.
export const resetCampEmailTextEndpoint = defineEndpoint({
  method: 'DELETE',
  path: '/camps/:campId/email-texts/:type',
  params: campEmailTextParamsSchema,
  response: campEmailTextSchema,
});

// A subject and text an admin is trying out, not saved.
export const campEmailDraftBodySchema = campEmailTextBodySchema.pick({ subject: true, text: true });

export type CampEmailDraftBody = z.infer<typeof campEmailDraftBodySchema>;

export const emailPreviewSchema = z.object({ subject: z.string(), html: z.string() });

export type EmailPreview = z.infer<typeof emailPreviewSchema>;

// Renders a subject and text of a type as the Camp would send it, with made-up data; Camp settings read.
export const previewCampEmailTextEndpoint = defineEndpoint({
  method: 'POST',
  path: '/camps/:campId/email-texts/:type/preview',
  params: campEmailTextParamsSchema,
  body: campEmailDraftBodySchema,
  response: emailPreviewSchema,
  status: 200,
});

// Sends a subject and text of a type, as the preview renders them with made-up data, to the signed-in admin's
// own address alone, on the type's stream; limited per admin. Camp settings write, as editing the text:
// an admin who may only read cannot make the platform send mail.
export const sendTestCampEmailEndpoint = defineEndpoint({
  method: 'POST',
  path: '/camps/:campId/email-texts/:type/test',
  params: campEmailTextParamsSchema,
  body: campEmailDraftBodySchema,
});
