import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { pragueDateOf } from '@repo/schema/shared';

import { DatePicker } from '@/components/date-picker/date-picker';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { useRecordPaymentMutation } from '@/features/participants/api/participants.queries';
import { amountOf, failureOf } from '@/features/participants/components/ledger/ledger-entry.helper';

interface PaymentFormProps {
  organisationId: string;
  registrationId: string;
}

// A payment received, or a Correcting payment that returns money.
export function PaymentForm({ organisationId, registrationId }: PaymentFormProps) {
  const { t } = useTranslation('participants');
  const [kind, setKind] = useState<'payment' | 'correction'>('payment');
  const [amount, setAmount] = useState('');
  // Today in Prague, read once when the form appears.
  const [paidOn, setPaidOn] = useState(() => pragueDateOf(new Date()));
  const [note, setNote] = useState('');
  const [isInvalid, setInvalid] = useState(false);
  const pay = useRecordPaymentMutation(organisationId, registrationId);
  const noteHintId = useId();
  const failure = isInvalid ? 'invalid_amount' : failureOf(pay.error);

  return (
    <form
      className="flex flex-col gap-3 rounded-[20px] border border-border-subtle p-4 text-sm"
      onSubmit={(event) => {
        event.preventDefault();
        const parsed = amountOf(amount, false);

        setInvalid(parsed === null);

        if (parsed !== null) {
          pay.mutate(
            { kind, amount: parsed, paidOn, note },
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
        {t('detail.kind')}
        <Select
          value={kind}
          onValueChange={setKind}
          options={[
            { value: 'payment', label: t('detail.payment') },
            { value: 'correction', label: t('detail.correction') },
          ]}
        />
      </label>
      <div className="grid gap-3 min-[400px]:grid-cols-2">
        <label className="flex min-w-0 flex-col gap-1.5 font-semibold">
          {t('detail.amount')}
          <Input inputMode="numeric" value={amount} onChange={(event) => setAmount(event.target.value)} />
        </label>
        <label className="flex min-w-0 flex-col gap-1.5 font-semibold">
          {t('detail.paidOn')}
          <DatePicker value={paidOn} onChange={setPaidOn} />
        </label>
      </div>
      <label className="flex flex-col gap-1.5 font-semibold">
        {t('detail.note')}
        <Input aria-describedby={noteHintId} value={note} onChange={(event) => setNote(event.target.value)} />
      </label>
      {/* A payment's note outlives the Registration's erasure, since the ledger stays intact. */}
      <p id={noteHintId} className="text-[13px] text-muted-foreground">
        {t('detail.paymentNoteHint')}
      </p>
      {failure === null ? null : (
        <p role="alert" className="text-destructive">
          {t(`detail.failure.${failure}`)}
        </p>
      )}
      <Button type="submit" className="self-start" disabled={pay.isPending}>
        {t('detail.record')}
      </Button>
    </form>
  );
}
