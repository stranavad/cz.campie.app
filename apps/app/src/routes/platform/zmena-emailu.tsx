import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';

import { EmailChangePage } from '@/features/email-change';

// The path and the token parameter are in every email change confirmation the API sends.
export const Route = createFileRoute('/platform/zmena-emailu')({
  validateSearch: z.object({ token: z.string().catch('') }),
  component: function EmailChangeRoute() {
    return <EmailChangePage token={Route.useSearch().token} />;
  },
});
