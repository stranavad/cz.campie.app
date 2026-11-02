import { logInEndpoint, type LogInBody } from '@repo/schema/admins';

import { apiClient } from '@/lib/api';

export const loginService = {
  logIn: (body: LogInBody) => apiClient.request(logInEndpoint, { body }),
};
