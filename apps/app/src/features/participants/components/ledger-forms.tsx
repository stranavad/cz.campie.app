import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { pragueDateOf } from '@repo/schema/shared';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  useAddPriceAdjustmentMutation,
  useRecordPaymentMutation,
} from '@/features/participants/api/participants.queries';
import { HttpError } from '@/lib/api';

/**
 * Read a whole CZK amount as typed, spaces allowed; null when it is not one.
 * @param text the amount as typed
 * @param signed whether a minus sign is allowed
 */
function amountOf(text: string, signed: boolean): number | null {
  const plain = text.replaceAll(/\s/g, '');

  return (signed ? /^-?\d+$/ : /^\d+$/).test(plain) && Number(plain) !== 0 ? Number(plain) : null;
}

/**
 * Name why a ledger entry was refused.
 * @param error what it failed with
 */
function failureOf(
  error: Error | null,
): 'correction_exceeds_paid' | 'price_adjustment_below_zero' | 'unexpected' | null {
  if (error === null) {
    return null;
  }

  const code = error instanceof HttpError ? error.code : undefined;

  return code === 'correction_exceeds_paid' || code === 'price_adjustment_below_zero' ? code : 'unexpected';
}

// Adds a payment, a Correcting payment or a Price adjustment; entries are never changed afterwards.
export function LedgerForms({ organisationId, registrationId }: { organisationId: string; registrationId: string }) {
  const { t } = useTranslation('participants');
  const [kind, setKind] = useState<'payment' | 'correction'>('payment');
  const [amount, setAmount] = useState('');
  // Today in Prague, read once when the form appears.
  const [paidOn, setPaidOn] = useState(() => pragueDateOf(new Date()));
  const [note, setNote] = useState('');
  const [adjustment, setAdjustment] = useState('');
  const [adjustmentNote, setAdjustmentNote] = useState('');
  const pay = useRecordPaymentMutation(organisationId, registrationId);
  const adjust = useAddPriceAdjustmentMutation(organisationId, registrationId);
  const [invalid, setInvalid] = useState<'payment' | 'adjustment' | null>(null);
  const payFailure = invalid === 'payment' ? 'invalid_amount' : failureOf(pay.error);
  const adjustFailure = invalid === 'adjustment' ? 'invalid_amount' : failureOf(adjust.error);

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <fieldset className="flex flex-col gap-2 rounded-lg border p-3">
        <legend className="px-1 text-sm font-medium">{t('detail.addPayment')}</legend>
        <select
          className="h-9 rounded-lg border border-input bg-transparent px-2 text-sm"
          value={kind}
          onChange={(event) => setKind(event.target.value === 'correction' ? 'correction' : 'payment')}
        >
          <option value="payment">{t('detail.payment')}</option>
          <option value="correction">{t('detail.correction')}</option>
        </select>
        <Input
          inputMode="numeric"
          placeholder={t('detail.amount')}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <Input type="date" value={paidOn} onChange={(event) => setPaidOn(event.target.value)} />
        <Input placeholder={t('detail.note')} value={note} onChange={(event) => setNote(event.target.value)} />
        {payFailure === null ? null : <p className="text-sm text-destructive">{t(`detail.failure.${payFailure}`)}</p>}
        <Button
          type="button"
          size="sm"
          disabled={pay.isPending}
          onClick={() => {
            const parsed = amountOf(amount, false);

            setInvalid(parsed === null ? 'payment' : null);

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
          {t('detail.record')}
        </Button>
      </fieldset>
      <fieldset className="flex flex-col gap-2 rounded-lg border p-3">
        <legend className="px-1 text-sm font-medium">{t('detail.addAdjustment')}</legend>
        <Input
          inputMode="numeric"
          placeholder={t('detail.adjustmentAmount')}
          value={adjustment}
          onChange={(event) => setAdjustment(event.target.value)}
        />
        <Input
          placeholder={t('detail.note')}
          value={adjustmentNote}
          onChange={(event) => setAdjustmentNote(event.target.value)}
        />
        {adjustFailure === null ? null : (
          <p className="text-sm text-destructive">{t(`detail.failure.${adjustFailure}`)}</p>
        )}
        <Button
          type="button"
          size="sm"
          disabled={adjust.isPending}
          onClick={() => {
            const parsed = amountOf(adjustment, true);

            setInvalid(parsed === null ? 'adjustment' : null);

            if (parsed !== null) {
              adjust.mutate(
                { amount: parsed, note: adjustmentNote },
                {
                  onSuccess: () => {
                    setAdjustment('');
                    setAdjustmentNote('');
                  },
                },
              );
            }
          }}
        >
          {t('detail.add')}
        </Button>
      </fieldset>
    </div>
  );
}
