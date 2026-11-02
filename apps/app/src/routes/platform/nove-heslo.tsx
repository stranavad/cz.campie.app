import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';

import { NewPasswordPage } from '@/features/password-reset';

// The path and the token parameter are in every reset email the API sends.
export const Route = createFileRoute('/platform/nove-heslo')({
  validateSearch: z.object({ token: z.string().catch('') }),
  component: function NewPasswordRoute() {
    return <NewPasswordPage token={Route.useSearch().token} />;
  },
});
