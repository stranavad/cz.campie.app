import { createFileRoute } from '@tanstack/react-router';

import { PortalPage } from '@/features/portal';

export const Route = createFileRoute('/organisation/portal/')({ component: PortalPage });
