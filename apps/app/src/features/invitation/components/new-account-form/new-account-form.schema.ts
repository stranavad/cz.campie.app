import { formOptions } from '@tanstack/react-form';
import { z } from 'zod';

import { fullNameSchema, passwordProblem, passwordSchema } from '@repo/schema/shared';

import { config } from '@/config';

/**
 * The invitee's name, and the password checked as the API checks it, against the invited email too.
 * @param email the invited email
 */
export function newAccountFormSchema(email: string) {
  return fullNameSchema.extend({
    password: passwordSchema.superRefine((password, context) => {
      const problem = passwordProblem(password, { email, productName: config.productName });

      if (problem !== null) {
        context.addIssue({ code: 'custom', message: problem });
      }
    }),
  });
}

export type NewAccountFormValues = z.input<ReturnType<typeof newAccountFormSchema>>;

export const newAccountFormOptions = formOptions({
  defaultValues: { firstName: '', lastName: '', password: '' } satisfies NewAccountFormValues,
});
