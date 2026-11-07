import { useNavigate } from '@tanstack/react-router';
import { useState } from 'react';

import { CURRENT_LEGAL_VERSIONS, SUBDOMAIN_ERROR_CODES } from '@repo/schema/organisations';
import { PASSWORD_ERROR_CODES, REQUEST_LIMIT_ERROR_CODES } from '@repo/schema/shared';

import { useAppForm } from '@/core/form';
import { useSignUpMutation } from '@/features/signup/api/signup.queries';
import {
  signupFormOptions,
  signupFormSchema,
  type SignupFormValues,
} from '@/features/signup/components/signup-form/signup-form.schema';
import { HttpError } from '@/lib/api';

// What the form shows above its button when the API refuses for a reason no field holds.
export type SignupFailure = 'legal_versions_outdated' | 'requests_throttled' | 'unexpected';

// The failure shown for a code no field holds.
function failureOf(code: string | undefined): SignupFailure {
  return code === 'legal_versions_outdated'
    ? code
    : (REQUEST_LIMIT_ERROR_CODES.find((known) => known === code) ?? 'unexpected');
}

// The field an API code belongs to, if any.
function fieldOf(code: string | undefined): keyof SignupFormValues | null {
  if ((SUBDOMAIN_ERROR_CODES as readonly (string | undefined)[]).includes(code)) {
    return 'subdomain';
  }

  if ((PASSWORD_ERROR_CODES as readonly (string | undefined)[]).includes(code)) {
    return 'password';
  }

  return code === 'email_taken' ? 'email' : null;
}

export function useSignupForm() {
  const signUp = useSignUpMutation();
  const navigate = useNavigate();
  const [failure, setFailure] = useState<SignupFailure | null>(null);

  const form = useAppForm({
    ...signupFormOptions,
    onSubmit: async ({ value, formApi }) => {
      setFailure(null);
      // parse() applies the schema's trimming and lowercasing before sending.
      const { acceptTerms: _, acceptDataProcessingAgreement: __, ...body } = signupFormSchema.parse(value);

      try {
        await signUp.mutateAsync({ ...body, acceptedVersions: CURRENT_LEGAL_VERSIONS });
        await navigate({ to: '/platform' });
      } catch (error) {
        // The form keeps its values for a retry; a code a field holds is shown at that field.
        const code = error instanceof HttpError ? error.code : undefined;
        const field = fieldOf(code);

        if (field !== null && code !== undefined) {
          formApi.setFieldMeta(field, (meta) => ({ ...meta, errorMap: { ...meta.errorMap, onSubmit: code } }));
        } else {
          setFailure(failureOf(code));
        }
      }
    },
  });

  return { form, failure };
}
