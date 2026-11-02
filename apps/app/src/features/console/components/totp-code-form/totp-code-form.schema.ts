import { formOptions } from '@tanstack/react-form';
import type { z } from 'zod';

import { verifyTotpBodySchema } from '@repo/schema/admins';

// Confirming a new secret and passing a login take the same six digits.
export const totpCodeFormSchema = verifyTotpBodySchema;

export type TotpCodeFormValues = z.input<typeof totpCodeFormSchema>;

const TOTP_CODE_FORM_DEFAULTS: TotpCodeFormValues = { code: '' };

export const totpCodeFormOptions = formOptions({
  defaultValues: TOTP_CODE_FORM_DEFAULTS,
  validators: { onSubmit: totpCodeFormSchema },
});
