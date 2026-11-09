import { useTranslation } from 'react-i18next';

import type { RegistrationDetail } from '@repo/schema/registrations';
import { czk } from '@repo/schema/shared';

import { LedgerRow } from '@/features/participants/components/registration-detail/ledger-row';

interface PriceLinesProps {
  detail: RegistrationDetail;
}

// The price: its lines, by child where a line is one child's, the adjustments and the total.
export function PriceLines({ detail }: PriceLinesProps) {
  const { t } = useTranslation('participants');
  const { t: tRegistration } = useTranslation('registration');
  const nameAt = (position: number | null) => {
    const participant = detail.participants.find((candidate) => candidate.position === position);

    return participant === undefined ? null : t('name', { first: participant.firstName, last: participant.lastName });
  };

  return (
    <div className="flex flex-col gap-1">
      <h3 className="text-[13px] font-medium text-muted-foreground">{t('detail.price')}</h3>
      <dl className="flex flex-col text-sm">
        {detail.priceLines.map((line, index) => {
          const name = nameAt(line.participant);
          const label = line.label ?? tRegistration(`price.kinds.${line.kind}`);

          return (
            <LedgerRow
              key={index}
              label={name === null ? label : t('detail.lineOf', { line: label, participant: name })}
              value={czk(line.amount)}
            />
          );
        })}
        {detail.ledger.adjustments.map((adjustment) => (
          <LedgerRow
            key={adjustment.id}
            label={t('detail.adjustment', { note: adjustment.note })}
            value={czk(adjustment.amount)}
          />
        ))}
        <LedgerRow label={t('detail.total')} value={czk(detail.ledger.total)} isTotal />
      </dl>
    </div>
  );
}
