import { useQuery } from '@tanstack/react-query';

import type { ParticipantRow } from '@repo/schema/registrations';
import { czechDate } from '@repo/schema/shared';

import { participantListQueryOptions } from '@/core/participant-list';

// How many Registrations the children come from.
const familiesOf = (rows: ParticipantRow[]) => new Set(rows.map(({ registrationId }) => registrationId)).size;

// What waits in the Turnus: overdue payments by Registration, Claimed discounts to verify and unsigned
// Consents by child, each with where to deal with it. Only what has something waiting, Cancelled children aside.
export function useWaitingList(organisationId: string, turnusId: string, canWrite: boolean) {
  // The same entry as the Registrations list's tab counts, so a change there shows here.
  const participants = useQuery(participantListQueryOptions(organisationId, turnusId, {}));
  const registered = (participants.data ?? []).filter(({ status }) => status === 'registered');
  const overdue = registered.filter((row) => row.overdue);
  const unverified = registered.filter((row) => row.unverifiedClaimedDiscount);
  const unsigned = registered.filter((row) => row.unsignedConsent);
  const [oldestDue] = overdue
    .map(({ amountDue }) => amountDue.dueDate)
    .filter((date) => date !== null)
    .toSorted();
  const items = [
    {
      key: 'overdue',
      count: familiesOf(overdue),
      tone: 'danger',
      date: oldestDue === undefined ? null : czechDate(oldestDue),
      families: null,
      action: canWrite ? 'remind' : 'show',
      search: canWrite ? ({ panel: 'reminders' } as const) : ({ platba: 'overdue' } as const),
    },
    {
      key: 'unverified',
      count: unverified.length,
      tone: 'neutral',
      date: null,
      families: familiesOf(unverified),
      action: canWrite ? 'verify' : 'show',
      search: { kontrola: ['unverified'] },
    },
    {
      key: 'unsigned',
      count: unsigned.length,
      tone: 'neutral',
      date: null,
      families: familiesOf(unsigned),
      action: canWrite ? 'remind' : 'show',
      search: canWrite ? ({ panel: 'reminders' } as const) : ({ kontrola: ['unsignedConsent'] } as const),
    },
  ] as const;

  return {
    isPending: participants.isPending,
    isError: participants.isError,
    items: items.filter(({ count }) => count > 0),
  };
}
