import { createFileRoute } from '@tanstack/react-router';

import { ForgottenPasswordPage } from '@/features/password-reset';

export const Route = createFileRoute('/platform/zapomenute-heslo')({ component: ForgottenPasswordPage });
