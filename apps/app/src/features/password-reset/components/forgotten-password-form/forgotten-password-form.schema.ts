import { formOptions } from '@tanstack/react-form';
import type { z } from 'zod';

import { requestPasswordResetBodySchema } from '@repo/schema/admins';

export const forgottenPasswordFormSchema = requestPasswordResetBodySchema;

export type ForgottenPasswordFormValues = z.input<typeof forgottenPasswordFormSchema>;

const FORGOTTEN_PASSWORD_FORM_DEFAULTS: ForgottenPasswordFormValues = { email: '' };

export const forgottenPasswordFormOptions = formOptions({
  defaultValues: FORGOTTEN_PASSWORD_FORM_DEFAULTS,
  validators: { onSubmit: forgottenPasswordFormSchema },
});
