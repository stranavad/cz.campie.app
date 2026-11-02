import { signUpOrganisationEndpoint, type SignUpOrganisationBody } from '@repo/schema/organisations';

import { apiClient } from '@/lib/api';

export const signupService = {
  signUp: (body: SignUpOrganisationBody) => apiClient.request(signUpOrganisationEndpoint, { body }),
};
