import { Link, Navigate } from '@tanstack/react-router';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import type { AnswerValue } from '@repo/schema/form-engine';
import type { AnswerRow } from '@repo/schema/registrations';
import { czechDate, czechDateTime, czk } from '@repo/schema/shared';

import { Button } from '@/components/ui/button';
import { AdminActions } from '@/features/participants/components/admin-actions';
import { EraseRegistration } from '@/features/participants/components/erase-registration';
import { LedgerForms } from '@/features/participants/components/ledger-forms';
import { RegistrationConsents } from '@/features/participants/components/registration-consents';
import { RegistrationControls } from '@/features/participants/components/registration-controls';
import { RegistrationDocuments } from '@/features/participants/components/registration-documents';
import { useRegistrationDetailPage } from '@/features/participants/components/use-registration-detail-page.hook';

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-lg font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right">{value}</span>
    </div>
  );
}

// Everything about one Registration for an admin answering a guardian; read access sees it all read-only.
export function RegistrationDetailPage({ registrationId }: { registrationId: string }) {
  const { t } = useTranslation('participants');
  const { t: tRegistration } = useTranslation('registration');
  const { t: tCommon } = useTranslation();
  const page = useRegistrationDetailPage(registrationId);

  if (page.isSignedOut) {
    return <Navigate to="/platform/prihlaseni" replace />;
  }

  if (page.isLoading) {
    return <p className="py-12 text-muted-foreground">{t('loading')}</p>;
  }

  if (page.hasNoAccess) {
    return <p className="py-12">{t('noAccess')}</p>;
  }

  if (page.isError || page.detail === undefined) {
    return <p className="py-12 text-destructive">{t('detail.error')}</p>;
  }

  const { detail } = page;
  const shown = (value: AnswerValue) =>
    value === null
      ? t('detail.unanswered')
      : typeof value === 'boolean'
        ? t(value ? 'detail.yes' : 'detail.no')
        : Array.isArray(value)
          ? value.join(', ')
          : String(value);
  const answerLabel = (row: AnswerRow) => {
    const label = row.label ?? (row.labelKey === null ? row.key : tCommon(row.labelKey, { defaultValue: row.key }));

    return row.state === 'answered' ? label : t(`detail.state.${row.state}`, { label });
  };
  const nameAt = (position: number | null) => {
    const participant = detail.participants.find((candidate) => candidate.position === position);

    return participant === undefined ? null : t('name', { first: participant.firstName, last: participant.lastName });
  };

  return (
    <div className="flex flex-col gap-8 py-8">
      <header className="flex flex-col gap-1">
        <Link to="/platform/prihlasky" className="text-sm text-muted-foreground underline">
          {t('detail.back')}
        </Link>
        <h1 className="text-2xl font-semibold">{t('detail.title', { symbol: detail.variableSymbol })}</h1>
        <p className="text-sm text-muted-foreground">
          {t('detail.subtitle', {
            camp: detail.camp.name,
            turnus: detail.turnus.name,
            date: czechDateTime(detail.submittedAt),
            version: detail.formVersion,
          })}
        </p>
      </header>
      <Section title={t('detail.guardians')}>
        {detail.guardians.map((guardian) => (
          <p key={guardian.position} className="text-sm">
            {t('detail.guardianLine', {
              name: `${guardian.firstName} ${guardian.lastName}`,
              email: guardian.email,
              phone: guardian.phone ?? '',
            })}
            {guardian.undeliverable ? (
              <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-950">
                {t('detail.emailUndeliverable')}
              </span>
            ) : null}
          </p>
        ))}
        {detail.registrationAnswers.map((row) => (
          <Row key={row.key} label={answerLabel(row)} value={shown(row.value)} />
        ))}
      </Section>
      {detail.participants.map((participant) => (
        <Section
          key={participant.id}
          title={t(participant.status === 'cancelled' ? 'detail.participantCancelled' : 'name', {
            first: participant.firstName,
            last: participant.lastName,
          })}
        >
          {participant.birthDate === null ? null : (
            <Row label={t('detail.birthDate')} value={czechDate(participant.birthDate)} />
          )}
          {participant.ageOnStart === null ? null : (
            <Row label={t('detail.ageOnStart')} value={String(participant.ageOnStart)} />
          )}
          {participant.answers.map((row) => (
            <Row key={row.key} label={answerLabel(row)} value={shown(row.value)} />
          ))}
          {participant.prihlaska === null ? null : (
            <a href={participant.prihlaska.url} target="_blank" rel="noreferrer" className="text-sm underline">
              {t('detail.prihlaska')}
            </a>
          )}
          {detail.claimedDiscounts
            .filter(({ participantId }) => participantId === participant.id)
            .map((discount) => (
              <div key={`${discount.fieldId}-${discount.optionId ?? ''}`} className="flex items-center gap-3 text-sm">
                <span>{t('detail.claimed', { label: discount.label, amount: czk(discount.amount) })}</span>
                {discount.verifiedAt !== null ? (
                  <span className="text-muted-foreground">{t('detail.verified')}</span>
                ) : page.canWrite ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={page.isVerifying}
                    onClick={() => page.verify(participant.id, discount.fieldId, discount.optionId)}
                  >
                    {t('detail.verify')}
                  </Button>
                ) : (
                  <span className="text-muted-foreground">{t('detail.unverified')}</span>
                )}
              </div>
            ))}
        </Section>
      ))}
      <Section title={t('detail.price')}>
        {detail.priceLines.map((line, index) => {
          const name = nameAt(line.participant);
          const label = line.label ?? tRegistration(`price.kinds.${line.kind}`);

          return (
            <Row
              key={index}
              label={name === null ? label : t('detail.lineOf', { line: label, participant: name })}
              value={czk(line.amount)}
            />
          );
        })}
        {detail.ledger.adjustments.map((adjustment) => (
          <Row
            key={adjustment.id}
            label={t('detail.adjustment', { note: adjustment.note })}
            value={czk(adjustment.amount)}
          />
        ))}
        <Row label={t('detail.total')} value={czk(detail.ledger.total)} />
      </Section>
      <Section title={t('detail.payments')}>
        {detail.ledger.payments.map((payment) => (
          <Row
            key={payment.id}
            label={t(`detail.source.${payment.source}`, { date: czechDate(payment.paidOn), note: payment.note })}
            value={czk(payment.amount)}
          />
        ))}
        <Row label={t('detail.paid')} value={czk(detail.ledger.paid)} />
        <Row label={t('detail.balance')} value={czk(detail.ledger.balance)} />
        <Row
          label={t(`status.${detail.ledger.status}`)}
          value={
            detail.ledger.amountDue.amount === 0
              ? ''
              : t('detail.dueNow', {
                  amount: czk(detail.ledger.amountDue.amount),
                  date: detail.ledger.amountDue.dueDate === null ? '' : czechDate(detail.ledger.amountDue.dueDate),
                })
          }
        />
        {detail.ledger.overdue ? <p className="text-sm text-destructive">{t('detail.overdue')}</p> : null}
        {page.canWrite ? <LedgerForms organisationId={page.organisationId} registrationId={registrationId} /> : null}
      </Section>
      <RegistrationConsents organisationId={page.organisationId} registrationId={registrationId} />
      <RegistrationDocuments
        organisationId={page.organisationId}
        registrationId={registrationId}
        canWrite={page.canWrite}
      />
      {page.canWrite ? <AdminActions organisationId={page.organisationId} detail={detail} /> : null}
      {page.canWrite ? <RegistrationControls organisationId={page.organisationId} detail={detail} /> : null}
      {page.isOwner && detail.guardians.length > 0 ? (
        <EraseRegistration organisationId={page.organisationId} registrationId={registrationId} />
      ) : null}
      <Section title={t('detail.declarations')}>
        {detail.declarations.map((declaration, index) => (
          <p key={index} className="text-sm">
            {t(declaration.accepted ? 'detail.accepted' : 'detail.notAccepted', { text: declaration.text })}
          </p>
        ))}
      </Section>
      <Section title={t('detail.history')}>
        <ol className="flex flex-col gap-2">
          {page.history.map((entry) => (
            <li key={entry.id} className="text-sm">
              <span className="mr-2 text-muted-foreground">{czechDateTime(entry.occurredAt)}</span>
              {t('detail.historyLine', {
                actor: entry.actor.name ?? t(`detail.actor.${entry.actor.kind}`),
                action: t(`detail.action.${entry.action}`, { defaultValue: entry.action }),
              })}
              {entry.encryptedFields.length === 0 ? null : (
                <span className="block text-muted-foreground">
                  {t('detail.encryptedChanged', { fields: entry.encryptedFields.join(', ') })}
                </span>
              )}
              {entry.changes === null ? null : (
                <span className="block text-muted-foreground">
                  {Object.entries(entry.changes)
                    .map(
                      ([field, change]) => `${field}: ${JSON.stringify(change.old)} -> ${JSON.stringify(change.new)}`,
                    )
                    .join('; ')}
                </span>
              )}
            </li>
          ))}
        </ol>
      </Section>
    </div>
  );
}
