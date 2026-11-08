import type { Actor } from '../audit/actor.ts';
import { allows, type MemberAccess } from './permission.ts';

// An admin acting on a Registration, and what they may do with its health data: read it, and change it.
export interface AdminAccess {
  readonly actor: Actor;
  readonly health: { readonly read: boolean; readonly write: boolean };
}

/**
 * Tell what an admin request may do with health data, by its membership.
 * @param actor the admin
 * @param member their membership
 */
export function adminAccessOf(actor: Actor, member: MemberAccess): AdminAccess {
  return {
    actor,
    health: {
      read: allows(member, { area: 'health', level: 'read' }),
      write: allows(member, { area: 'health', level: 'write' }),
    },
  };
}
