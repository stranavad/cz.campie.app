import { createFileRoute } from '@tanstack/react-router';

import { DocumentsPage } from '@/features/portal';

export const Route = createFileRoute('/organisation/portal/$registrationId_/dokumenty')({
  component: function PortalDocumentsRoute() {
    return <DocumentsPage registrationId={Route.useParams().registrationId} />;
  },
});
