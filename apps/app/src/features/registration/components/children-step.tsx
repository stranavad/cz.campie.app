import { ChildChips } from '@/features/registration/components/child-chips';
import { ParticipantSection } from '@/features/registration/components/participant-section';
import type { RegistrationPageState } from '@/features/registration/components/use-registration-page.hook';

interface ChildrenStepProps {
  page: RegistrationPageState;
}

// The second step: the children as chips, the chosen one's answers below, and a sibling to add.
export function ChildrenStep({ page }: ChildrenStepProps) {
  const index = page.activeChild;
  const answers = page.participants[index] ?? {};

  return (
    <>
      <ChildChips
        participants={page.participants}
        active={index}
        onSelect={page.setActiveChild}
        invalid={page.invalidChildren}
        onAdd={page.canAddParticipant ? page.addParticipant : null}
        siblingDiscount={page.siblingDiscount}
      />
      <ParticipantSection
        key={index}
        index={index}
        fields={page.participantFields}
        answers={answers}
        onChange={(key, value) => page.setParticipantAnswer(index, key, value)}
        onRemove={page.participants.length > 1 ? () => page.removeParticipant(index) : null}
        messageAt={page.messageAt}
        ageNote={page.ageNote(answers)}
      />
    </>
  );
}
