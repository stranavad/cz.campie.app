import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';

import { RegistrationPage } from '@/features/registration';

// The chosen Turnus lives in the address, so a reload or a shared link keeps it.
export const Route = createFileRoute('/organisation/$campSlug/prihlaska')({
  validateSearch: z.object({ turnus: z.uuid().optional().catch(undefined) }),
  component: function RegistrationRoute() {
    const { campSlug } = Route.useParams();
    const { turnus } = Route.useSearch();

    return <RegistrationPage campSlug={campSlug} turnusId={turnus} />;
  },
});
