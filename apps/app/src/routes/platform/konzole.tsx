import { createFileRoute } from '@tanstack/react-router';

import { ConsolePage } from '@/features/console';

export const Route = createFileRoute('/platform/konzole')({ component: ConsolePage });
