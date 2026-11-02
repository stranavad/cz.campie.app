import { createFileRoute } from '@tanstack/react-router';

import { AdminHomePage } from '@/features/admin-home';

export const Route = createFileRoute('/platform/')({ component: AdminHomePage });
