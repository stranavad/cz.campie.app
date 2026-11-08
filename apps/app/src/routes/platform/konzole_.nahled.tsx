import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';

import { ConsolePreviewPage } from '@/features/console';

export const Route = createFileRoute('/platform/konzole_/nahled')({
  validateSearch: z.object({ organizace: z.uuid().catch('') }),
  component: function ConsolePreviewRoute() {
    const { organizace } = Route.useSearch();

    return <ConsolePreviewPage organisationId={organizace} />;
  },
});
