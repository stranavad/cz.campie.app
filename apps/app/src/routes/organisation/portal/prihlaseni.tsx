import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';

import { LoginPage } from '@/features/portal';

// The path and the token parameter are in every login link the API emails.
export const Route = createFileRoute('/organisation/portal/prihlaseni')({
  validateSearch: z.object({ token: z.string().optional().catch(undefined) }),
  component: function PortalLoginRoute() {
    return <LoginPage token={Route.useSearch().token ?? ''} />;
  },
});
