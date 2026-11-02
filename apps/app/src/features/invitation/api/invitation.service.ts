import { acceptInvitationEndpoint, lookUpInvitationEndpoint, type AcceptInvitationBody } from '@repo/schema/admins';

import { apiClient } from '@/lib/api';

export const invitationService = {
  lookUp: (token: string, signal?: AbortSignal) =>
    apiClient.request(lookUpInvitationEndpoint, { body: { token }, signal }),
  accept: (body: AcceptInvitationBody) => apiClient.request(acceptInvitationEndpoint, { body }),
};
