import {
  confirmTotpEnrolmentEndpoint,
  regenerateRecoveryCodesEndpoint,
  startTotpEnrolmentEndpoint,
  verifyTotpEndpoint,
  type ConfirmTotpEnrolmentBody,
  type RegenerateRecoveryCodesBody,
  type VerifyTotpBody,
} from '@repo/schema/admins';

import { apiClient } from '@/lib/api';

export const twoStepService = {
  startEnrolment: () => apiClient.request(startTotpEnrolmentEndpoint),
  confirmEnrolment: (body: ConfirmTotpEnrolmentBody) => apiClient.request(confirmTotpEnrolmentEndpoint, { body }),
  verify: (body: VerifyTotpBody) => apiClient.request(verifyTotpEndpoint, { body }),
  regenerateRecoveryCodes: (body: RegenerateRecoveryCodesBody) =>
    apiClient.request(regenerateRecoveryCodesEndpoint, { body }),
};
