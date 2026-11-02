import { formOptions } from '@tanstack/react-form';
import type { z } from 'zod';

import { logInBodySchema } from '@repo/schema/admins';

export const loginFormSchema = logInBodySchema;

export type LoginFormValues = z.input<typeof loginFormSchema>;

const LOGIN_FORM_DEFAULTS: LoginFormValues = { email: '', password: '' };

export const loginFormOptions = formOptions({
  defaultValues: LOGIN_FORM_DEFAULTS,
  validators: { onSubmit: loginFormSchema },
});
