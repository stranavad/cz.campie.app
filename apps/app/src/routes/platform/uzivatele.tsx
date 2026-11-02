import { createFileRoute } from '@tanstack/react-router';

import { MembersPage } from '@/features/members';

export const Route = createFileRoute('/platform/uzivatele')({ component: MembersPage });
