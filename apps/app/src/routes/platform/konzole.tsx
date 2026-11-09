import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';

import { CONSOLE_SECTION_SLUGS, ConsolePage, consoleSectionOf } from '@/features/console';

export const Route = createFileRoute('/platform/konzole')({
  validateSearch: z.object({ sekce: z.enum(CONSOLE_SECTION_SLUGS).optional().catch(undefined) }),
  component: function ConsoleRoute() {
    const { sekce } = Route.useSearch();

    return <ConsolePage section={consoleSectionOf(sekce)} />;
  },
});
