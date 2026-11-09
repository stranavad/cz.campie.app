import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';

import { CONSOLE_SECTIONS, ConsolePage } from '@/features/console';

export const Route = createFileRoute('/platform/konzole')({
  validateSearch: z.object({ sekce: z.enum(CONSOLE_SECTIONS).optional().catch(undefined) }),
  component: function ConsoleRoute() {
    const { sekce } = Route.useSearch();

    return <ConsolePage section={sekce ?? 'organizace'} />;
  },
});
