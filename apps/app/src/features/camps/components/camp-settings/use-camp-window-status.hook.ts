import { useTurnusyQuery } from '@/features/camps/api/camps.queries';

export type CampWindowStatus = 'open' | 'notYetOpen' | 'closed' | null;

// The Camp's Registration state read from its Turnusy: open while any takes Registrations, upcoming while
// any is yet to open, otherwise closed. None without Turnusy, or until they load.
export function useCampWindowStatus(organisationId: string, campId: string): CampWindowStatus {
  const turnusy = useTurnusyQuery(organisationId, campId).data ?? [];

  if (turnusy.some(({ availability }) => availability === 'open')) {
    return 'open';
  }

  if (turnusy.some(({ availability }) => availability === 'not_yet_open')) {
    return 'notYetOpen';
  }

  return turnusy.length === 0 ? null : 'closed';
}
