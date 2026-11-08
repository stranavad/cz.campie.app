import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';

import { CAMP_SETTINGS_SECTIONS, CampsPage } from '@/features/camps';

export const Route = createFileRoute('/platform/tabory')({
  validateSearch: z.object({
    tabor: z.uuid().optional().catch(undefined),
    sekce: z.enum(CAMP_SETTINGS_SECTIONS).optional().catch(undefined),
  }),
  component: function CampsRoute() {
    const { tabor, sekce } = Route.useSearch();

    return <CampsPage campId={tabor} section={sekce ?? 'zaklad'} />;
  },
});
