import type { GuardianRegistration } from '@repo/schema/portal';

/**
 * Group Registrations by Camp and Turnus, in the order they come.
 * @param registrations the guardian's Registrations, newest first
 */
export function groupsOf(registrations: readonly GuardianRegistration[]) {
  // A Turnus belongs to one Camp, so its id names the group; names repeat from year to year.
  const groups = new Map<string, { camp: string; turnus: string; registrations: GuardianRegistration[] }>();

  for (const registration of registrations) {
    const key = registration.turnus.id;
    const group = groups.get(key) ?? {
      camp: registration.camp.name,
      turnus: registration.turnus.name,
      registrations: [],
    };

    group.registrations.push(registration);
    groups.set(key, group);
  }

  return [...groups.values()];
}
