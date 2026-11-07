import { createFileRoute } from '@tanstack/react-router';

import { ConsentsPage } from '@/features/portal';

export const Route = createFileRoute('/organisation/portal/$registrationId_/souhlasy')({
  component: function PortalConsentsRoute() {
    return <ConsentsPage registrationId={Route.useParams().registrationId} />;
  },
});
