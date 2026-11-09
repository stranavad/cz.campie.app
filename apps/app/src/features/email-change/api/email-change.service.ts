import { confirmEmailChangeEndpoint, type ConfirmEmailChangeBody } from '@repo/schema/admins';

import { apiClient } from '@/lib/api';

export const emailChangeService = {
  confirm: (body: ConfirmEmailChangeBody) => apiClient.request(confirmEmailChangeEndpoint, { body }),
};
