import {
  checkSubdomainEndpoint,
  signUpOrganisationEndpoint,
  type SignUpOrganisationBody,
} from '@repo/schema/organisations';

import { apiClient } from '@/lib/api';

export const signupService = {
  signUp: (body: SignUpOrganisationBody) => apiClient.request(signUpOrganisationEndpoint, { body }),
  checkSubdomain: (subdomain: string, signal?: AbortSignal) =>
    apiClient.request(checkSubdomainEndpoint, { params: { subdomain }, signal }),
};
