import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';

import { CampPreviewPage } from '@/features/camps';

export const Route = createFileRoute('/platform/tabory_/nahled')({
  validateSearch: z.object({ tabor: z.uuid().catch('') }),
  component: function CampPreviewRoute() {
    const { tabor } = Route.useSearch();

    return <CampPreviewPage campId={tabor} />;
  },
});
