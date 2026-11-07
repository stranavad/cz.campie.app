import { createFileRoute } from '@tanstack/react-router';

import { CreateRegistrationPage } from '@/features/participants';

export const Route = createFileRoute('/platform/prihlasky_/nova')({ component: CreateRegistrationPage });
