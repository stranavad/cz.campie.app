import { Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { DeclarationCheckbox } from '@/core/registration-form';
import { GuardianSection } from '@/features/registration/components/guardian-section';
import { ParticipantSection } from '@/features/registration/components/participant-section';
import { PaymentSection } from '@/features/registration/components/payment-section';
import { PriceCard } from '@/features/registration/components/price-card';
import { SubmittedView } from '@/features/registration/components/submitted-view';
import { useRegistrationPage } from '@/features/registration/components/use-registration-page.hook';

interface RegistrationPageProps {
  campSlug: string;
  turnusId: string | undefined;
}

// The public registration form of a Camp, for one Turnus, and what the guardian sees once it is sent.
export function RegistrationPage({ campSlug, turnusId }: RegistrationPageProps) {
  const { t } = useTranslation('registration');
  const page = useRegistrationPage(campSlug, turnusId);

  if (page.isLoading) {
    return null;
  }

  if (page.hasNoForm || page.isError || page.camp === undefined || page.form === undefined) {
    return <p className="py-12">{page.hasNoForm ? t('noForm') : t('error')}</p>;
  }

  if (page.submitted !== undefined) {
    return <SubmittedView camp={page.camp} submitted={page.submitted} />;
  }

  return (
    <div className="flex flex-col gap-6 py-8">
      <Link to="/organisation/$campSlug" params={{ campSlug }} className="text-sm underline">
        {t('back', { camp: page.camp.name })}
      </Link>
      <h1 className="text-2xl font-semibold">{t('title', { camp: page.camp.name })}</h1>
      <label className="flex flex-col gap-1 text-sm font-medium">
        {t('turnus')}
        <select
          className="h-9 rounded-lg border border-input bg-transparent px-2"
          value={page.turnus?.id ?? ''}
          onChange={(event) => page.selectTurnus(event.target.value)}
        >
          <option value="">{t('pickTurnus')}</option>
          {page.turnusy.map((turnus) => (
            <option key={turnus.id} value={turnus.id} disabled={turnus.availability !== 'open'}>
              {turnus.name}
            </option>
          ))}
        </select>
      </label>
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
        <Button type="button" variant="outline" className="self-start" onClick={page.addParticipant}>
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
      />
      <fieldset className="flex flex-col gap-3">
        <legend className="mb-2 font-medium">{t('declarations')}</legend>
        {page.form.declarations.map((declaration) => (
          <DeclarationCheckbox
            key={declaration.id}
            declaration={declaration}
            checked={page.ticked.includes(declaration.id)}
            onChange={(checked) => page.tick(declaration.id, checked)}
          />
        ))}
        {page.missingDeclarations.length === 0 ? null : (
          <p role="alert" className="text-sm text-destructive">
            {t('declarationsMissing')}
          </p>
        )}
      </fieldset>
      <PriceCard price={page.price} isStale={page.isPriceStale} isFailing={page.isPriceFailing} />
      {page.refusalMessage === null && !page.hasFieldRefusal ? null : (
        <p role="alert" className="text-sm text-destructive">
          {page.refusalMessage ?? t('refused.fields')}
        </p>
      )}
      <Button type="button" className="self-start" onClick={page.send} disabled={page.isSending}>
        {page.isSending ? t('sending') : t('send')}
      </Button>
    </div>
  );
}
