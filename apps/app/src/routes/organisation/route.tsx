import { createFileRoute } from '@tanstack/react-router';

import { OrganisationShell } from '@/core/organisation-shell';

// Reached only on an Organisation's subdomain; the host rewrite adds this segment (core/host).
export const Route = createFileRoute('/organisation')({ component: OrganisationShell });
