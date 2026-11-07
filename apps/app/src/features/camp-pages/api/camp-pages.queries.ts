import { useQuery } from '@tanstack/react-query';

import { campPagesKeys } from '@/features/camp-pages/api/camp-pages.keys';
import { campPagesService } from '@/features/camp-pages/api/camp-pages.service';

export const usePublicCampsQuery = () =>
  useQuery({ queryKey: campPagesKeys.list(), queryFn: ({ signal }) => campPagesService.list(signal) });

export const usePublicCampQuery = (slug: string) =>
  useQuery({ queryKey: campPagesKeys.camp(slug), queryFn: ({ signal }) => campPagesService.camp(slug, signal) });

// Availability changes as the window opens and places fill, so it is fetched again each minute.
export const usePublicTurnusyQuery = (slug: string) =>
  useQuery({
    queryKey: campPagesKeys.turnusy(slug),
    queryFn: ({ signal }) => campPagesService.turnusy(slug, signal),
    refetchInterval: 60_000,
  });
