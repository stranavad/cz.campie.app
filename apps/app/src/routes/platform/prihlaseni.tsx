import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';

import { LoginPage } from '@/features/login';

export const Route = createFileRoute('/platform/prihlaseni')({
  validateSearch: z.object({ zpet: z.string().optional().catch(undefined) }),
  component: function LoginRoute() {
    return <LoginPage returnTo={Route.useSearch().zpet} />;
  },
});
