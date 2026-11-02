import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';

import { InvitationPage } from '@/features/invitation';

// The path and the token parameter are in every invitation email the API sends.
export const Route = createFileRoute('/platform/pozvanka')({
  validateSearch: z.object({ token: z.string().catch('') }),
  component: function InvitationRoute() {
    return <InvitationPage token={Route.useSearch().token} />;
  },
});
