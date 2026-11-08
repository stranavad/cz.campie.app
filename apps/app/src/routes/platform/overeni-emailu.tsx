import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';

import { EmailVerificationPage } from '@/features/email-verification';

// The path and the token parameter are in every verification email the API sends.
export const Route = createFileRoute('/platform/overeni-emailu')({
  validateSearch: z.object({ token: z.string().catch('') }),
  component: function EmailVerificationRoute() {
    return <EmailVerificationPage token={Route.useSearch().token} />;
  },
});
