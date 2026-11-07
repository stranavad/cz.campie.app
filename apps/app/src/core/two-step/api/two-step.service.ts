import {
  confirmTotpEnrolmentEndpoint,
  startTotpEnrolmentEndpoint,
  verifyTotpEndpoint,
  type ConfirmTotpEnrolmentBody,
  type VerifyTotpBody,
} from '@repo/schema/admins';

import { apiClient } from '@/lib/api';

export const twoStepService = {
  startEnrolment: () => apiClient.request(startTotpEnrolmentEndpoint),
  confirmEnrolment: (body: ConfirmTotpEnrolmentBody) => apiClient.request(confirmTotpEnrolmentEndpoint, { body }),
  verify: (body: VerifyTotpBody) => apiClient.request(verifyTotpEndpoint, { body }),
};
