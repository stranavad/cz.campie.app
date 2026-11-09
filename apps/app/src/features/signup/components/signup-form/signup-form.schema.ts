import { formOptions } from '@tanstack/react-form';
import { z } from 'zod';

import { signUpOrganisationBodySchema, subdomainProblem } from '@repo/schema/organisations';
import { passwordProblem } from '@repo/schema/shared';

import { config } from '@/config';

const accepted = z.boolean().refine((value) => value, 'consent_required');

// The contract's body, with the subdomain and the password checked as the API checks them (only a taken
// subdomain is the API's to tell) and the two consents as checkboxes; the accepted versions are added on
// submit.
export const signupFormSchema = signUpOrganisationBodySchema
  .omit({ acceptedVersions: true })
  .extend({
    subdomain: signUpOrganisationBodySchema.shape.subdomain.superRefine((subdomain, context) => {
      const problem = subdomainProblem(subdomain, config.productName);

      if (problem !== null) {
        context.addIssue({ code: 'custom', message: problem });
      }
    }),
    acceptTerms: accepted,
    acceptDataProcessingAgreement: accepted,
  })
  .superRefine(({ password, email }, context) => {
    const problem = passwordProblem(password, { email, productName: config.productName });

    if (problem !== null) {
      context.addIssue({ code: 'custom', path: ['password'], message: problem });
    }
  });

export type SignupFormValues = z.input<typeof signupFormSchema>;

const SIGNUP_FORM_DEFAULTS: SignupFormValues = {
  legalName: '',
  ico: '',
  vatId: '',
  address: '',
  statutoryRepresentative: '',
  contactEmail: '',
  contactPhone: '',
  billingEmail: '',
  campName: '',
  subdomain: '',
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  acceptTerms: false,
  acceptDataProcessingAgreement: false,
};

// Shared by the form and its sections, so each section is typed by the same values.
export const signupFormOptions = formOptions({
  defaultValues: SIGNUP_FORM_DEFAULTS,
  validators: { onChange: signupFormSchema },
});
