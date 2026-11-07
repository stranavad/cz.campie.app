import { Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

import type { GuardianRegistration } from '@repo/schema/portal';
import { czechDate, czk } from '@repo/schema/shared';

import { CardPaymentButtons } from '@/features/portal/components/card-payment-buttons';
import { QrPlatba } from '@/features/portal/components/qr-platba';

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right tabular-nums">{value}</span>
    </div>
  );
}

// One Registration in the portal: its children, price, payments and how to pay the rest.
export function RegistrationCard({ registration }: { registration: GuardianRegistration }) {
  const { t } = useTranslation('portal');
  const { t: tRegistration } = useTranslation('registration');
  const { payment } = registration;
  const nameAt = (position: number | null) => {
    const participant = registration.participants.find((candidate) => candidate.position === position);

    return participant === undefined
      ? null
      : t('participant', { first: participant.firstName, last: participant.lastName });
  };

  return (
    <article className="flex flex-col gap-4 rounded-lg border p-4">
      <header className="flex flex-col gap-1">
        <h3 className="font-semibold">
          {t('dates', { start: czechDate(registration.turnus.startDate), end: czechDate(registration.turnus.endDate) })}
        </h3>
        <p className="text-sm text-muted-foreground">{t('variableSymbol', { symbol: registration.variableSymbol })}</p>
        <Link
          to="/organisation/portal/$registrationId"
          params={{ registrationId: registration.id }}
          className="self-start text-sm underline"
        >
          {t('edit.open')}
        </Link>
      </header>
      <ul className="flex flex-col gap-2">
        {registration.participants.map((participant) => (
          <li key={participant.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <span className={participant.status === 'cancelled' ? 'text-muted-foreground line-through' : ''}>
              {t(participant.status === 'cancelled' ? 'participantCancelled' : 'participant', {
                first: participant.firstName,
                last: participant.lastName,
              })}
            </span>
            {participant.prihlaska === null ? null : (
              <a href={participant.prihlaska.url} target="_blank" rel="noreferrer" className="underline">
                {t('prihlaska')}
              </a>
            )}
          </li>
        ))}
      </ul>
      <section className="flex flex-col gap-1">
        <h4 className="text-sm font-medium">{t('price')}</h4>
        {registration.priceLines.map((line, index) => {
          const name = nameAt(line.participant);
          const label = line.label ?? tRegistration(`price.kinds.${line.kind}`);

          return (
            <Row
              key={index}
              label={name === null ? label : t('lineOf', { line: label, participant: name })}
              value={czk(line.amount)}
            />
          );
        })}
        {registration.adjustments.map((adjustment, index) => (
          <Row key={`adjustment-${index}`} label={t('adjustment')} value={czk(adjustment.amount)} />
        ))}
        <Row label={t('total')} value={czk(registration.total)} />
      </section>
      <section className="flex flex-col gap-1">
        <h4 className="text-sm font-medium">{t('payments')}</h4>
        {registration.payments.length === 0 ? <p className="text-sm text-muted-foreground">{t('noPayments')}</p> : null}
        {registration.payments.map((entry, index) => (
          <Row key={index} label={czechDate(entry.paidOn)} value={czk(entry.amount)} />
        ))}
        {registration.balance < 0 ? (
          <Row label={t('overpaid')} value={czk(-registration.balance)} />
        ) : (
          <Row label={t('balance')} value={czk(registration.balance)} />
        )}
        <p className="text-sm font-medium">{t(`status.${registration.status}`)}</p>
      </section>
      {payment.amount === 0 ? null : (
        <section className="flex flex-col gap-3">
          <h4 className="text-sm font-medium">{t('howToPay')}</h4>
          {registration.overdue ? (
            <p role="alert" className="text-sm text-destructive">
              {t('overdue')}
            </p>
          ) : null}
          {payment.account === null ? (
            <p className="text-sm">{t('noAccount')}</p>
          ) : (
            <Row label={t('account')} value={payment.account} />
          )}
          <Row label={t('variableSymbolLabel')} value={registration.variableSymbol} />
          {payment.card ? (
            <CardPaymentButtons
              registrationId={registration.id}
              dueNow={payment.amount}
              outstanding={payment.balance?.outstanding ?? null}
            />
          ) : null}
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="flex flex-col gap-1">
              <Row label={payment.phase === 'deposit' ? t('depositNow') : t('amountNow')} value={czk(payment.amount)} />
              {payment.dueDate === null ? null : <Row label={t('dueDate')} value={czechDate(payment.dueDate)} />}
              {payment.qrPlatba === null ? null : <QrPlatba payload={payment.qrPlatba} />}
              {payment.balance === null ? null : (
                <Row
                  label={t('rest')}
                  value={
                    payment.balance.dueDate === null
                      ? czk(payment.balance.amount)
                      : t('restBy', { amount: czk(payment.balance.amount), date: czechDate(payment.balance.dueDate) })
                  }
                />
              )}
            </div>
            {payment.balance === null ? null : (
              <div className="flex flex-col gap-1">
                <Row label={t('allAtOnce')} value={czk(payment.balance.outstanding)} />
                {payment.balance.qrPlatba === null ? null : <QrPlatba payload={payment.balance.qrPlatba} />}
              </div>
            )}
          </div>
        </section>
      )}
      <footer className="text-sm text-muted-foreground">
        {registration.camp.contactPhone === null
          ? t('campContact', { email: registration.camp.contactEmail })
          : t('campContactWithPhone', { email: registration.camp.contactEmail, phone: registration.camp.contactPhone })}
      </footer>
    </article>
  );
}
