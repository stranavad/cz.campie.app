import { formOptions } from '@tanstack/react-form';
import type { z } from 'zod';

import { requestEmailChangeBodySchema } from '@repo/schema/admins';

export const accountEmailFormSchema = requestEmailChangeBodySchema;

export type AccountEmailFormValues = z.input<typeof accountEmailFormSchema>;

const ACCOUNT_EMAIL_FORM_DEFAULTS: AccountEmailFormValues = { email: '', currentPassword: '' };

export const accountEmailFormOptions = formOptions({
  defaultValues: ACCOUNT_EMAIL_FORM_DEFAULTS,
  validators: { onSubmit: accountEmailFormSchema },
});
