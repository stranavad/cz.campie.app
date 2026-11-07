import { createFileRoute } from '@tanstack/react-router';

import { AccountSettingsPage } from '@/features/account-settings';

export const Route = createFileRoute('/platform/ucet')({ component: AccountSettingsPage });
