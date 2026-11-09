import { useTurnusyQuery } from '@/core/camp-list';
import {
  useCampBrandingQuery,
  useRemoveCampLogoMutation,
  useSetCampLogoMutation,
} from '@/features/camps/api/camps.queries';

export function useCampBrandingSection(organisationId: string, campId: string) {
  return {
    branding: useCampBrandingQuery(organisationId, campId),
    turnusy: useTurnusyQuery(organisationId, campId).data ?? [],
    setLogo: useSetCampLogoMutation(organisationId, campId),
    removeLogo: useRemoveCampLogoMutation(organisationId, campId),
  };
}
