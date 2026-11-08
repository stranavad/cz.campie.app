import { verifyEmailEndpoint, type VerifyEmailBody } from '@repo/schema/admins';

import { apiClient } from '@/lib/api';

export const emailVerificationService = {
  verify: (body: VerifyEmailBody) => apiClient.request(verifyEmailEndpoint, { body }),
};
