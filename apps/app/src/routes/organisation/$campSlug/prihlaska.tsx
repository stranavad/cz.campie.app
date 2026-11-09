import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';

import { RegistrationPage } from '@/features/registration';

// The chosen Turnus lives in the address, so a reload or a shared link keeps it; so does the form's step,
// so the browser's back button goes back a step.
export const Route = createFileRoute('/organisation/$campSlug/prihlaska')({
  validateSearch: z.object({
    turnus: z.uuid().optional().catch(undefined),
    krok: z.number().int().min(2).max(4).optional().catch(undefined),
  }),
  component: function RegistrationRoute() {
    const { campSlug } = Route.useParams();
    const { turnus, krok } = Route.useSearch();

    return <RegistrationPage campSlug={campSlug} turnusId={turnus} step={krok ?? 1} />;
  },
});
