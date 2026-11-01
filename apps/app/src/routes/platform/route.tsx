import { createFileRoute } from '@tanstack/react-router';

import { PlatformShell } from '@/core/platform-shell';

// Reached only on the main host; the host rewrite adds this segment (core/host).
export const Route = createFileRoute('/platform')({ component: PlatformShell });
