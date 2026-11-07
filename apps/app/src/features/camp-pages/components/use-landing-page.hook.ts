import { usePublicCampsQuery } from '@/features/camp-pages/api/camp-pages.queries';

export function useLandingPage() {
  const camps = usePublicCampsQuery();
  const list = camps.data ?? [];

  return {
    isLoading: camps.isPending,
    isError: camps.isError,
    camps: list,
    // With one Camp the landing is that Camp's page.
    onlyCamp: list.length === 1 ? list[0] : undefined,
  };
}
