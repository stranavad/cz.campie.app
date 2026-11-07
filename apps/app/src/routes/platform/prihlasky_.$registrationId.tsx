import { createFileRoute } from '@tanstack/react-router';

import { RegistrationDetailPage } from '@/features/participants';

export const Route = createFileRoute('/platform/prihlasky_/$registrationId')({
  component: function RegistrationDetailRoute() {
    return <RegistrationDetailPage registrationId={Route.useParams().registrationId} />;
  },
});
