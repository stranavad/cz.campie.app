import { Link } from '@tanstack/react-router';
import { ChevronLeftIcon, PlusIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { czechDate } from '@repo/schema/shared';

import { BackHeader } from '@/components/back-header';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { DeclarationsSection } from '@/features/registration/components/declarations-section';
import { GuardianSection } from '@/features/registration/components/guardian-section';
import { ParticipantSection } from '@/features/registration/components/participant-section';
import { PaymentSection } from '@/features/registration/components/payment-section';
import { PriceBar } from '@/features/registration/components/price-bar';
import { PriceCard } from '@/features/registration/components/price-card';
import { SubmittedView } from '@/features/registration/components/submitted-view';
import { TurnusSection } from '@/features/registration/components/turnus-section';
import { useRegistrationPage } from '@/features/registration/components/use-registration-page.hook';

interface RegistrationPageProps {
  campSlug: string;
  turnusId: string | undefined;
}

// The public registration form of a Camp, for one Turnus, and what the guardian sees once it is sent.
// One page of section cards; the price and the send button stay pinned to the bottom.
export function RegistrationPage({ campSlug, turnusId }: RegistrationPageProps) {
  const { t } = useTranslation('registration');
  const page = useRegistrationPage(campSlug, turnusId);

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

  if (page.submitted !== undefined) {
    return <SubmittedView camp={page.camp} submitted={page.submitted} cardStatus={page.cardStatus} />;
  }

  return (
    <div className="flex flex-col gap-4 pb-4">
      <BackHeader
        back={(className) => (
          <Link
            to="/organisation/$campSlug"
            params={{ campSlug }}
            className={className}
            aria-label={t('back', { camp: page.camp?.name })}
          >
            <ChevronLeftIcon aria-hidden="true" />
          </Link>
        )}
        title={page.camp.name}
        subtitle={
          page.turnus === undefined
            ? undefined
            : t('turnusOption', {
                name: page.turnus.name,
                start: czechDate(page.turnus.startDate),
                end: czechDate(page.turnus.endDate),
              })
        }
      />
      <div className="flex flex-col gap-1 px-1">
        <h1 className="text-title">{t('screenTitle')}</h1>
        <p className="text-muted-foreground">{t('lead')}</p>
      </div>
      <TurnusSection
        turnus={page.turnus}
        turnusy={page.turnusy}
        onSelect={page.selectTurnus}
        isMissing={page.isChecking && page.turnus === undefined}
      />
      {page.participants.map((answers, index) => (
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
      ))}
      {page.canAddParticipant ? (
        <Button type="button" variant="dashed" size="lg" onClick={page.addParticipant}>
          <PlusIcon aria-hidden="true" />
          {t('addChild')}
        </Button>
      ) : null}
      <GuardianSection
        fields={page.registrationFields}
        answers={page.registration}
        onChange={page.setRegistrationAnswer}
        hasSecondGuardian={page.hasSecondGuardian}
        onSecondGuardian={page.setSecondGuardian}
        messageAt={page.messageAt}
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
      <DeclarationsSection
        declarations={page.form.declarations}
        ticked={page.ticked}
        onTick={page.tick}
        isMissing={page.missingDeclarations.length > 0}
      />
      <PriceCard price={page.price} isStale={page.isPriceStale} isFailing={page.isPriceFailing} />
      {page.refusalMessage === null && !page.hasFieldRefusal ? null : (
        <Alert variant="danger" role="alert">
          {page.refusalMessage ?? t('refused.fields')}
        </Alert>
      )}
      <PriceBar
        price={page.price}
        isStale={page.isPriceStale}
        isFailing={page.isPriceFailing}
        hasTurnus={page.turnus !== undefined}
        isSending={page.isSending}
        onSend={page.send}
      />
    </div>
  );
}
