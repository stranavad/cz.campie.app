import { useRegistrationFormQuery } from '@/features/camps/api/camps.queries';

export function useRegistrationFormSection(organisationId: string, campId: string) {
  return useRegistrationFormQuery(organisationId, campId);
}
