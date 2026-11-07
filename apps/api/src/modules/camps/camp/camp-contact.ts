import type { CampEntity } from '../../../repositories/camps/camp/camp.entity.ts';
import type { OrganisationEntity } from '../../../repositories/organisations/organisation/organisation.entity.ts';

/**
 * Tell how a Camp is reached: its own contact, or its Organisation's when it has none.
 * @param camp the Camp
 * @param organisation its Organisation
 */
export function campContactOf(
  camp: CampEntity,
  organisation: OrganisationEntity,
): { contactEmail: string; contactPhone: string | null } {
  return {
    contactEmail: camp.contactEmail ?? organisation.contactEmail,
    contactPhone: camp.contactPhone ?? (camp.contactEmail === null ? organisation.contactPhone : null),
  };
}
