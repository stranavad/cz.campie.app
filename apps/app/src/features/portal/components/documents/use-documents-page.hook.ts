import { useGuardianDocumentsQuery } from '@/features/portal/api/portal.queries';
import { needsAction } from '@/features/portal/components/documents/requirement-status.helper';
import { useSelectedParticipant } from '@/features/portal/components/shared/use-selected-participant.hook';

/**
 * A Registration's documents for the child shown: the ones still to hand in, and the ones handed in.
 * @param registrationId the guardian's Registration
 */
export function useDocumentsPage(registrationId: string) {
  const documents = useGuardianDocumentsQuery(registrationId);
  const participants = documents.data?.participants ?? [];
  const requirements = documents.data?.requirements ?? [];
  const { selected, select } = useSelectedParticipant(participants);
  // Without a child to hand them in for, every requirement shows in full, to read.
  const isToHandIn = (requirementId: string) =>
    selected === undefined || needsAction(selected.uploads[requirementId] ?? []);

  return {
    documents,
    selected,
    select,
    switchParticipants: participants.map(({ id, firstName, uploads }) => ({
      id,
      firstName,
      left: requirements.filter((requirement) => needsAction(uploads[requirement.id] ?? [])).length,
    })),
    toHandIn: requirements.filter(({ id }) => isToHandIn(id)),
    handedIn: requirements.filter(({ id }) => !isToHandIn(id)),
  };
}
