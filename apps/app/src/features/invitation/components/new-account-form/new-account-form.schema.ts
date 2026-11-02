import { formOptions } from '@tanstack/react-form';
import { z } from 'zod';

import { passwordProblem, passwordSchema } from '@repo/schema/shared';

import { config } from '@/config';

/**
 * The password checked as the API checks it, against the invited email too.
 * @param email the invited email
 */
export function newAccountFormSchema(email: string) {
  return z.object({
    password: passwordSchema.superRefine((password, context) => {
      const problem = passwordProblem(password, { email, productName: config.productName });

      if (problem !== null) {
        context.addIssue({ code: 'custom', message: problem });
      }
    }),
  });
}

export type NewAccountFormValues = z.input<ReturnType<typeof newAccountFormSchema>>;

export const newAccountFormOptions = formOptions({ defaultValues: { password: '' } satisfies NewAccountFormValues });
