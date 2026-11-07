import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';

import { CardPaymentResultPage } from '@/features/registration';

// Comgate sends the guardian back here, its transaction id in `id`, as the API asks it to.
export const Route = createFileRoute('/organisation/platba')({
  validateSearch: z.object({ id: z.string().optional().catch(undefined) }),
  component: function CardPaymentResultRoute() {
    return <CardPaymentResultPage transactionId={Route.useSearch().id ?? ''} />;
  },
});
