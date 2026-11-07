import { useCampQuery } from '@/features/camps/api/camps.queries';

export function useCamp(organisationId: string, campId: string) {
  return useCampQuery(organisationId, campId);
}
