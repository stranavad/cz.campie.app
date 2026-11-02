import { createFileRoute } from '@tanstack/react-router';

import { SignupPage } from '@/features/signup';

export const Route = createFileRoute('/platform/registrace-organizace')({ component: SignupPage });
