import { createFileRoute } from '@tanstack/react-router';

import { PrivacyPage } from '@/features/legal';

export const Route = createFileRoute('/platform/ochrana-udaju')({ component: PrivacyPage });
