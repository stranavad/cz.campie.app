import type { Person } from '@repo/schema/shared';

/**
 * Name an admin as every view does: by first and last name once they gave it, by email until then.
 * @param person the admin's email and name
 */
export function personName({ email, firstName, lastName }: Person): string {
  return firstName === null || lastName === null ? email : `${firstName} ${lastName}`;
}

/**
 * Name an admin with their email beside the name, where a reader must tell them from anyone who chose the
 * same name: whoever acted in the audit log, who invited, who let support in.
 * @param person the admin's email and name
 */
export function personNameWithEmail(person: Person): string {
  const name = personName(person);

  return name === person.email ? name : `${name} (${person.email})`;
}
