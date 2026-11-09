import { isEmpty } from '@repo/schema/form-engine';
import type { RegistrationDetail } from '@repo/schema/registrations';

import {
  useRegistrationConsentsQuery,
  useRegistrationDocumentsQuery,
} from '@/features/participants/api/participants.queries';
import { useAnswerText } from '@/features/participants/components/registration-detail/use-answer-text.hook';

// A child's checklist at a glance, from the Registration's Consents and documents: how many Consents are
// signed, the required documents not yet approved, and the questions added later that are still unanswered.
export function useParticipantChecklist(organisationId: string, registrationId: string) {
  const consents = useRegistrationConsentsQuery(organisationId, registrationId);
  const documents = useRegistrationDocumentsQuery(organisationId, registrationId);
  const { answerLabel } = useAnswerText();

  return (participant: RegistrationDetail['participants'][number]) => {
    const own = consents.data?.participants.find(({ id }) => id === participant.id)?.consents ?? [];
    const uploads = documents.data?.participants.find(({ id }) => id === participant.id)?.uploads ?? {};

    return {
      consents:
        own.length === 0 ? null : { signed: own.filter(({ state }) => state === 'signed').length, total: own.length },
      documents: (documents.data?.requirements ?? []).flatMap((requirement) => {
        const status = uploads[requirement.id]?.[0]?.status ?? 'missing';

        return status === 'approved' ? [] : [{ id: requirement.id, name: requirement.name, status }];
      }),
      unanswered: participant.answers
        .filter((row) => row.state === 'added' && isEmpty(row.value))
        .map((row) => ({ key: row.key, label: answerLabel({ ...row, state: 'answered' }) })),
    };
  };
}
