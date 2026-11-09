import { useTranslation } from 'react-i18next';

import { DeclarationsSection } from '@/features/registration/components/declarations-section';
import { PaymentSection } from '@/features/registration/components/payment-section';
import { RegistrationReview } from '@/features/registration/components/registration-review';
import type { RegistrationPageState } from '@/features/registration/components/use-registration-page.hook';

interface SummaryStepProps {
  page: RegistrationPageState;
}

// The last step: the answers read back, how the guardian pays, and the declarations to tick before sending.
export function SummaryStep({ page }: SummaryStepProps) {
  const { t } = useTranslation('registration');

  return (
    <>
      <RegistrationReview
        registrationFields={page.registrationFields}
        participantFields={page.participantFields}
        registration={page.registration}
        participants={page.participants}
        onEdit={page.edit}
      />
      <PaymentSection
        depositAvailable={page.depositAvailable}
        paymentChoice={page.paymentChoice}
        onPaymentChoice={page.setPaymentChoice}
        codeInput={page.codeInput}
        onCodeInput={page.setCodeInput}
        onApplyCode={page.applyCode}
        codeMessage={page.messageAt(['discountCode']) ?? (page.codeCheck === null ? null : t(`code.${page.codeCheck}`))}
        cardOffered={page.cardOffered}
        byCard={page.byCard}
        onByCard={page.setByCard}
      />
      {page.form === undefined ? null : (
        <DeclarationsSection
          declarations={page.form.declarations}
          ticked={page.ticked}
          onTick={page.tick}
          isMissing={page.missingDeclarations.length > 0}
        />
      )}
    </>
  );
}
