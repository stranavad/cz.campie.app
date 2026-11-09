import {
  changePasswordEndpoint,
  confirmTotpReplacementEndpoint,
  requestEmailChangeEndpoint,
  startTotpReplacementEndpoint,
  updateAccountEndpoint,
  type ChangePasswordBody,
  type ConfirmTotpReplacementBody,
  type RequestEmailChangeBody,
  type StartTotpReplacementBody,
  type UpdateAccountBody,
} from '@repo/schema/admins';

import { apiClient } from '@/lib/api';

export const accountSettingsService = {
  rename: (body: UpdateAccountBody) => apiClient.request(updateAccountEndpoint, { body }),
  changePassword: (body: ChangePasswordBody) => apiClient.request(changePasswordEndpoint, { body }),
  requestEmailChange: (body: RequestEmailChangeBody) => apiClient.request(requestEmailChangeEndpoint, { body }),
  startTotpReplacement: (body: StartTotpReplacementBody) => apiClient.request(startTotpReplacementEndpoint, { body }),
  confirmTotpReplacement: (body: ConfirmTotpReplacementBody) =>
    apiClient.request(confirmTotpReplacementEndpoint, { body }),
};
