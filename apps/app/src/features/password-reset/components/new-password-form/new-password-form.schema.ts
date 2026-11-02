import { formOptions } from '@tanstack/react-form';
import { z } from 'zod';

import { passwordProblem, passwordSchema } from '@repo/schema/shared';

import { config } from '@/config';

// The password checked as the API checks it, except against the email, which only the API knows here.
export const newPasswordFormSchema = z.object({
  password: passwordSchema.superRefine((password, context) => {
    const problem = passwordProblem(password, { productName: config.productName });

    if (problem !== null) {
      context.addIssue({ code: 'custom', message: problem });
    }
  }),
});

export type NewPasswordFormValues = z.input<typeof newPasswordFormSchema>;

const NEW_PASSWORD_FORM_DEFAULTS: NewPasswordFormValues = { password: '' };

export const newPasswordFormOptions = formOptions({
  defaultValues: NEW_PASSWORD_FORM_DEFAULTS,
  validators: { onChange: newPasswordFormSchema },
});
