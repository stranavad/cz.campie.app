import { ChevronDownIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import type { GuardianRegistration } from '@repo/schema/portal';
import { czechDate, czk } from '@repo/schema/shared';

import { PaymentRow } from '@/features/portal/components/home/payment-row';

// The price line by line and every payment received, folded away until asked for.
export function PriceBreakdown({ registration }: { registration: GuardianRegistration }) {
  const { t } = useTranslation('portal');
  const { t: tRegistration } = useTranslation('registration');
  const nameAt = (position: number | null) => {
    const participant = registration.participants.find((candidate) => candidate.position === position);

    return participant === undefined
      ? null
      : t('participant', { first: participant.firstName, last: participant.lastName });
  };

  return (
    <details className="group border-t border-border-subtle">
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 pt-3 text-sm font-semibold [&::-webkit-details-marker]:hidden">
        {t('breakdown')}
        <ChevronDownIcon
          aria-hidden="true"
          className="size-4 text-subtle-foreground transition-transform group-open:rotate-180"
        />
      </summary>
      <div className="flex flex-col gap-4 pt-2 text-sm">
        <section className="flex flex-col gap-1.5">
          <h3 className="text-[13px] font-bold text-muted-foreground">{t('price')}</h3>
          {registration.priceLines.map((line, index) => {
            const name = nameAt(line.participant);
            const label = line.label ?? tRegistration(`price.kinds.${line.kind}`);

            return (
              <PaymentRow
                key={index}
                label={name === null ? label : t('lineOf', { line: label, participant: name })}
                value={czk(line.amount)}
              />
            );
          })}
          {registration.adjustments.map((adjustment, index) => (
            <PaymentRow key={`adjustment-${index}`} label={t('adjustment')} value={czk(adjustment.amount)} />
          ))}
          <PaymentRow label={t('total')} value={czk(registration.total)} strong />
        </section>
        <section className="flex flex-col gap-1.5">
          <h3 className="text-[13px] font-bold text-muted-foreground">{t('payments')}</h3>
          {registration.payments.length === 0 ? <p className="text-muted-foreground">{t('noPayments')}</p> : null}
          {registration.payments.map((entry, index) => (
            <PaymentRow key={index} label={czechDate(entry.paidOn)} value={czk(entry.amount)} />
          ))}
          {registration.balance < 0 ? (
            <PaymentRow label={t('overpaid')} value={czk(-registration.balance)} strong />
          ) : (
            <PaymentRow label={t('balance')} value={czk(registration.balance)} strong />
          )}
        </section>
      </div>
    </details>
  );
}
