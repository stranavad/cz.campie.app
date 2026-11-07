import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';

import { ConfirmEmailPage } from '@/features/portal';

// The path and the token parameter are in every email change confirmation the API sends.
export const Route = createFileRoute('/organisation/portal/potvrzeni-emailu')({
  validateSearch: z.object({ token: z.string().optional().catch(undefined) }),
  component: function ConfirmEmailRoute() {
    return <ConfirmEmailPage token={Route.useSearch().token ?? ''} />;
  },
});
