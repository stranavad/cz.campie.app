import { createFileRoute } from '@tanstack/react-router';

import { ParticipantsPage, participantsSearchSchema } from '@/features/participants';

export const Route = createFileRoute('/platform/prihlasky')({
  validateSearch: participantsSearchSchema,
  component: function ParticipantsRoute() {
    const navigate = Route.useNavigate();

    return (
      <ParticipantsPage search={Route.useSearch()} onSearch={(search) => void navigate({ search, replace: true })} />
    );
  },
});
