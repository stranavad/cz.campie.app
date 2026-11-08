import { createFileRoute } from '@tanstack/react-router';

import { TermsPage } from '@/features/legal';

export const Route = createFileRoute('/platform/podminky')({ component: TermsPage });
