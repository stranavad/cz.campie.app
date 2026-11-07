import { createFileRoute } from '@tanstack/react-router';

import { OrganisationSettingsPage } from '@/features/organisation-settings';

export const Route = createFileRoute('/platform/nastaveni')({ component: OrganisationSettingsPage });
