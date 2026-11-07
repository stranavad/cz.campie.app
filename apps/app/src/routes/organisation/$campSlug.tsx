import { createFileRoute } from '@tanstack/react-router';

import { CampPage } from '@/features/camp-pages';

export const Route = createFileRoute('/organisation/$campSlug')({
  component: function CampRoute() {
    const { campSlug } = Route.useParams();

    return <CampPage campSlug={campSlug} />;
  },
});
