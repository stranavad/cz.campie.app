import type { RegistrationDetail } from '@repo/schema/registrations';

import { ParticipantChecklist } from '@/features/participants/components/registration-detail/participant-checklist';
import { ParticipantDetailCard } from '@/features/participants/components/registration-detail/participant-detail-card';
import { useParticipantChecklist } from '@/features/participants/components/registration-detail/use-participant-checklist.hook';

interface ParticipantCardsProps {
  organisationId: string;
  registrationId: string;
  detail: RegistrationDetail;
  canWrite: boolean;
  onVerify: (participantId: string, fieldId: string, optionId: string | null) => void;
  isVerifying: boolean;
}

// A card per child with its checklist; every child after the first starts folded.
export function ParticipantCards({ organisationId, registrationId, detail, onVerify, ...rest }: ParticipantCardsProps) {
  const checklistOf = useParticipantChecklist(organisationId, registrationId);

  return detail.participants.map((participant, index) => (
    <ParticipantDetailCard
      key={participant.id}
      participant={participant}
      discounts={detail.claimedDiscounts.filter(({ participantId }) => participantId === participant.id)}
      checklist={<ParticipantChecklist checklist={checklistOf(participant)} />}
      folded={index > 0}
      onVerify={(fieldId, optionId) => onVerify(participant.id, fieldId, optionId)}
      {...rest}
    />
  ));
}
