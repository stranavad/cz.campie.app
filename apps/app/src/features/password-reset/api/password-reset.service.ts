import {
  requestPasswordResetEndpoint,
  resetPasswordEndpoint,
  type RequestPasswordResetBody,
  type ResetPasswordBody,
} from '@repo/schema/admins';

import { apiClient } from '@/lib/api';

export const passwordResetService = {
  request: (body: RequestPasswordResetBody) => apiClient.request(requestPasswordResetEndpoint, { body }),
  reset: (body: ResetPasswordBody) => apiClient.request(resetPasswordEndpoint, { body }),
};
