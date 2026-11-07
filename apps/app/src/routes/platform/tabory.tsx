import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';

import { CampsPage } from '@/features/camps';

export const Route = createFileRoute('/platform/tabory')({
  validateSearch: z.object({ tabor: z.uuid().optional().catch(undefined) }),
  component: function CampsRoute() {
    const { tabor } = Route.useSearch();

    return <CampsPage campId={tabor} />;
  },
});
