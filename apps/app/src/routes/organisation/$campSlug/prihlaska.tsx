import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';

import { REGISTRATION_STEPS, RegistrationPage } from '@/features/registration';

// The chosen Turnus lives in the address, so a reload or a shared link keeps it; so does the form's step,
// so the browser's back button goes back a step.
export const Route = createFileRoute('/organisation/$campSlug/prihlaska')({
  validateSearch: z.object({
    turnus: z.uuid().optional().catch(undefined),
    // The first step has no number in the address.
    krok: z.number().int().min(2).max(REGISTRATION_STEPS.length).optional().catch(undefined),
  }),
  component: function RegistrationRoute() {
    const { campSlug } = Route.useParams();
    const { turnus, krok } = Route.useSearch();

    return <RegistrationPage campSlug={campSlug} turnusId={turnus} step={krok ?? 1} />;
  },
});
