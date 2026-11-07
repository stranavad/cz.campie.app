import { createFileRoute } from '@tanstack/react-router';

import { LandingPage } from '@/features/camp-pages';

export const Route = createFileRoute('/organisation/')({ component: LandingPage });
