import { QueryClient } from '@tanstack/react-query';

import { HttpError, isApiError } from '@/lib/api';

const MAX_RETRIES = 2;

// Retry only what can fix itself: the network, a timeout, the server's own failure. A client error or an
// invalid response would fail the same way again. Mutations never retry, to avoid repeating a change.
export function shouldRetry(failureCount: number, error: unknown): boolean {
  if (failureCount >= MAX_RETRIES || !isApiError(error)) {
    return false;
  }

  return error.kind === 'network' || error.kind === 'timeout' || (error instanceof HttpError && error.status >= 500);
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: shouldRetry },
    mutations: { retry: false },
  },
});
