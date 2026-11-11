import { useTranslation } from 'react-i18next';

import { Alert } from '@/components/ui/alert';
import { ChildrenStep } from '@/features/registration/components/children-step';
import { GuardiansStep } from '@/features/registration/components/guardians-step';
import { LeaveDialog } from '@/features/registration/components/leave-dialog';
import { PriceBar } from '@/features/registration/components/price-bar';
import { QuestionsSection } from '@/features/registration/components/questions-section';
import { RegistrationHeader } from '@/features/registration/components/registration-header';
import { REGISTRATION_STEPS } from '@/features/registration/components/registration-step.constant';
import { SubmittedView } from '@/features/registration/components/submitted-view';
import { SummaryStep } from '@/features/registration/components/summary-step';
import { useRegistrationPage } from '@/features/registration/components/use-registration-page.hook';

interface RegistrationPageProps {
  campSlug: string;
  turnusId: string | undefined;
  // 1-based, from the address.
  step: number;
}

// The public registration form of a Camp, for one Turnus, in four steps, and what the guardian sees once
// it is sent. The price and the step's action stay pinned to the bottom.
export function RegistrationPage({ campSlug, turnusId, step }: RegistrationPageProps) {
  const { t } = useTranslation('registration');
  const page = useRegistrationPage(campSlug, turnusId, step);
  const name = REGISTRATION_STEPS[page.step - 1] ?? 'guardians';
  const isLast = page.step === page.stepCount;

  if (page.isLoading) {
    return null;
  }

  if (page.hasNoForm || page.isError || page.camp === undefined || page.form === undefined) {
    return (
      <Alert variant={page.hasNoForm ? 'info' : 'danger'} role={page.hasNoForm ? undefined : 'alert'} className="my-8">
        {page.hasNoForm ? t('noForm') : t('error')}
      </Alert>
    );
  }

  if (page.submitted !== undefined && page.submittedKey !== null && page.turnus !== undefined) {
    return (
      <SubmittedView
        camp={page.camp}
        turnus={page.turnus}
        participants={page.participants}
        registration={page.registration}
        submitted={page.submitted}
        submittedKey={page.submittedKey}
        cardStatus={page.cardStatus}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4 pb-4">
      <RegistrationHeader camp={page.camp} turnus={page.turnus} step={page.step} />
      <h1 tabIndex={-1} className="px-1 pt-2 text-title outline-none">
        {t(`steps.${name}.title`)}
      </h1>
      {name === 'guardians' ? <GuardiansStep page={page} /> : null}
      {name === 'children' ? <ChildrenStep page={page} /> : null}
      {name === 'questions' ? (
        <QuestionsSection
          fields={page.registrationFields}
          answers={page.registration}
          onChange={page.setRegistrationAnswer}
          messageAt={page.messageAt}
        />
      ) : null}
      {name === 'summary' ? <SummaryStep page={page} /> : null}
      {page.refusalMessage === null && !page.hasFieldRefusal ? null : (
        <Alert variant="danger" role="alert">
          {page.refusalMessage ?? t('refused.fields')}
        </Alert>
      )}
      <LeaveDialog
        open={page.leave.status === 'blocked'}
        onStay={() => page.leave.reset?.()}
        onLeave={() => page.leave.proceed?.()}
      />
      <PriceBar
        price={page.price}
        isStale={page.isPriceStale}
        isFailing={page.isPriceFailing}
        hasTurnus={page.turnus !== undefined}
        action={isLast ? (page.isSending ? t('sending') : t('send')) : t('next')}
        isBusy={isLast && page.isSending}
        onAction={isLast ? page.send : page.next}
      />
    </div>
  );
}
