import { formOptions } from '@tanstack/react-form';
import type { z } from 'zod';

import { confirmTotpEnrolmentBodySchema, verifyTotpBodySchema } from '@repo/schema/admins';

// Confirming a new secret takes the six digits; passing a login takes them or a recovery code.
export const totpCodeFormSchemas = { confirm: confirmTotpEnrolmentBodySchema, verify: verifyTotpBodySchema };

export type TotpCodeFormValues = z.input<typeof verifyTotpBodySchema>;

const TOTP_CODE_FORM_DEFAULTS: TotpCodeFormValues = { code: '' };

export const totpCodeFormOptions = formOptions({ defaultValues: TOTP_CODE_FORM_DEFAULTS });
