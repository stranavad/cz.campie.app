import { formOptions } from '@tanstack/react-form';
import type { z } from 'zod';

import { requestLoginLinkBodySchema } from '@repo/schema/portal';

export const loginFormSchema = requestLoginLinkBodySchema;

export type LoginFormValues = z.input<typeof loginFormSchema>;

const LOGIN_FORM_DEFAULTS: LoginFormValues = { email: '' };

export const loginFormOptions = formOptions({
  defaultValues: LOGIN_FORM_DEFAULTS,
  validators: { onSubmit: loginFormSchema },
});
