import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';

import { CHECK_FILTERS, PARTICIPANTS_PANELS, ParticipantsPage, PAYMENT_TABS } from '@/features/participants';

export const Route = createFileRoute('/platform/prihlasky')({
  validateSearch: z.object({
    platba: z.enum(PAYMENT_TABS).optional().catch(undefined),
    kontrola: z.array(z.enum(CHECK_FILTERS)).readonly().optional().catch(undefined),
    panel: z.enum(PARTICIPANTS_PANELS).optional().catch(undefined),
  }),
  component: function ParticipantsRoute() {
    const navigate = Route.useNavigate();

    return (
      <ParticipantsPage search={Route.useSearch()} onSearch={(search) => void navigate({ search, replace: true })} />
    );
  },
});
