import { createFileRoute } from '@tanstack/react-router';

import { ParticipantsPage } from '@/features/participants';

export const Route = createFileRoute('/platform/prihlasky')({ component: ParticipantsPage });
