// Whether a Turnus takes Registrations from guardians now, and why not.
export const TURNUS_AVAILABILITIES = ['not_yet_open', 'open', 'closed_manually', 'closed_by_window', 'full'] as const;

export type TurnusAvailability = (typeof TURNUS_AVAILABILITIES)[number];

export interface AvailabilityRules {
  // Opening is inclusive, closing exclusive, either may be open-ended.
  readonly opensAt: Date | null;
  readonly closesAt: Date | null;
  readonly closedManually: boolean;
  readonly capacity: number;
}

/**
 * Tell whether a Turnus takes Registrations at an instant: not when switched off by hand, outside its
 * Registration window, or when its Registered Participants fill its capacity.
 * @param turnus its window, switch and capacity
 * @param registered how many Registered Participants it holds
 * @param now the instant
 */
export function turnusAvailability(turnus: AvailabilityRules, registered: number, now: Date): TurnusAvailability {
  if (turnus.closedManually) {
    return 'closed_manually';
  }

  if (turnus.opensAt !== null && now < turnus.opensAt) {
    return 'not_yet_open';
  }

  if (turnus.closesAt !== null && now >= turnus.closesAt) {
    return 'closed_by_window';
  }

  return registered >= turnus.capacity ? 'full' : 'open';
}
