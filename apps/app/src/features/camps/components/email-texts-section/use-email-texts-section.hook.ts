import { useEmailTextsQuery } from '@/features/camps/api/camps.queries';

export function useEmailTextsSection(organisationId: string, campId: string) {
  return useEmailTextsQuery(organisationId, campId);
}
