import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAddPriceAdjustmentMutation } from '@/features/participants/api/participants.queries';
import { amountOf, failureOf } from '@/features/participants/components/ledger/ledger-entry.helper';

interface AdjustmentFormProps {
  organisationId: string;
  registrationId: string;
}

// A Price adjustment: a surcharge, or a discount as a negative amount.
export function AdjustmentForm({ organisationId, registrationId }: AdjustmentFormProps) {
  const { t } = useTranslation('participants');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [isInvalid, setInvalid] = useState(false);
  const adjust = useAddPriceAdjustmentMutation(organisationId, registrationId);
  const failure = isInvalid ? 'invalid_amount' : failureOf(adjust.error);

  return (
    <form
      className="flex flex-col gap-3 rounded-[20px] border border-border-subtle p-4 text-sm"
      onSubmit={(event) => {
        event.preventDefault();
        const parsed = amountOf(amount, true);

        setInvalid(parsed === null);

        if (parsed !== null) {
          adjust.mutate(
            { amount: parsed, note },
            {
              onSuccess: () => {
                setAmount('');
                setNote('');
              },
            },
          );
        }
      }}
    >
      <label className="flex flex-col gap-1.5 font-semibold">
        {t('detail.adjustmentAmount')}
        <Input inputMode="numeric" value={amount} onChange={(event) => setAmount(event.target.value)} />
      </label>
      <label className="flex flex-col gap-1.5 font-semibold">
        {t('detail.note')}
        <Input value={note} onChange={(event) => setNote(event.target.value)} />
      </label>
      {failure === null ? null : (
        <p role="alert" className="text-destructive">
          {t(`detail.failure.${failure}`)}
        </p>
      )}
      <Button type="submit" className="self-start" disabled={adjust.isPending}>
        {t('detail.add')}
      </Button>
    </form>
  );
}
