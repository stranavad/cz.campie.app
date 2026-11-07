import {
  endGuardianSessionEndpoint,
  listGuardianRegistrationsEndpoint,
  requestLoginLinkEndpoint,
  startGuardianSessionEndpoint,
  type RequestLoginLinkBody,
  type StartGuardianSessionBody,
} from '@repo/schema/portal';

import { apiClient } from '@/lib/api';

export const portalService = {
  requestLink: (body: RequestLoginLinkBody) => apiClient.request(requestLoginLinkEndpoint, { body }),
  signIn: (body: StartGuardianSessionBody) => apiClient.request(startGuardianSessionEndpoint, { body }),
  signOut: () => apiClient.request(endGuardianSessionEndpoint, {}),
  registrations: (signal?: AbortSignal) => apiClient.request(listGuardianRegistrationsEndpoint, { signal }),
};
