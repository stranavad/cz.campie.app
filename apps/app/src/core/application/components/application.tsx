import { QueryClientProvider } from '@tanstack/react-query';
import { Outlet } from '@tanstack/react-router';

import { queryClient } from '@/core/application/query-client';

export function Application() {
  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
    </QueryClientProvider>
  );
}
