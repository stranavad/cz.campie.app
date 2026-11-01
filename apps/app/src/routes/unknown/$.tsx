import { createFileRoute } from '@tanstack/react-router';

import { UnknownHostPage } from '@/core/host';

// Every path on a host outside the platform; the host rewrite adds this segment (core/host).
export const Route = createFileRoute('/unknown/$')({ component: UnknownHostPage });
