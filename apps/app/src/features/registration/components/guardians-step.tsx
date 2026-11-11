import { GuardianSection } from '@/features/registration/components/guardian-section';
import { TurnusSection } from '@/features/registration/components/turnus-section';
import type { RegistrationPageState } from '@/features/registration/components/use-registration-page.hook';

interface GuardiansStepProps {
  page: RegistrationPageState;
}

// The first step: the guardians, and the Turnus when the link to the form named none.
export function GuardiansStep({ page }: GuardiansStepProps) {
  return (
    <>
      {page.asksTurnus ? (
        <TurnusSection
          turnus={page.turnus}
          turnusy={page.turnusy}
          onSelect={page.selectTurnus}
          isMissing={page.isTurnusMissing}
          closedMessage={page.turnusClosedMessage}
        />
      ) : null}
      <GuardianSection
        fields={page.registrationFields}
        answers={page.registration}
        onChange={page.setRegistrationAnswer}
        hasSecondGuardian={page.hasSecondGuardian}
        onSecondGuardian={page.setSecondGuardian}
        messageAt={page.messageAt}
      />
    </>
  );
}
