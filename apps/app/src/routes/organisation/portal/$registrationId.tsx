import { createFileRoute } from '@tanstack/react-router';

import { EditPage } from '@/features/portal';

export const Route = createFileRoute('/organisation/portal/$registrationId')({
  component: function PortalEditRoute() {
    return <EditPage registrationId={Route.useParams().registrationId} />;
  },
});
