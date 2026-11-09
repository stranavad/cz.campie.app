import { formOptions } from '@tanstack/react-form';
import type { z } from 'zod';

import { changePasswordBodySchema } from '@repo/schema/admins';
import { passwordProblem } from '@repo/schema/shared';

import { config } from '@/config';

/**
 * The current password, and the new one checked as the API checks it, against the admin's email too.
 * @param email the admin's email
 */
export function accountPasswordFormSchema(email: string) {
  return changePasswordBodySchema.superRefine(({ password }, context) => {
    const problem = passwordProblem(password, { email, productName: config.productName });

    if (problem !== null) {
      context.addIssue({ code: 'custom', message: problem, path: ['password'] });
    }
  });
}

export type AccountPasswordFormValues = z.input<ReturnType<typeof accountPasswordFormSchema>>;

const ACCOUNT_PASSWORD_FORM_DEFAULTS: AccountPasswordFormValues = { currentPassword: '', password: '' };

export const accountPasswordFormOptions = formOptions({ defaultValues: ACCOUNT_PASSWORD_FORM_DEFAULTS });
