import { usePublicCampQuery, usePublicTurnusyQuery } from '@/features/camp-pages/api/camp-pages.queries';
import { HttpError } from '@/lib/api';

export function useCampPage(slug: string) {
  const camp = usePublicCampQuery(slug);
  const turnusy = usePublicTurnusyQuery(slug);

  return {
    isLoading: camp.isPending || turnusy.isPending,
    isNotFound: camp.error instanceof HttpError && camp.error.status === 404,
    isError: camp.isError || turnusy.isError,
    camp: camp.data,
    turnusy: turnusy.data ?? [],
    // A former slug leads to the Camp; the address moves to its current one.
    currentSlug: camp.data !== undefined && camp.data.slug !== slug ? camp.data.slug : null,
  };
}
