import { useTranslation } from 'react-i18next';

import { PAYMENT_CHOICES, type PaymentChoice } from '@repo/schema/pricing';

import { Input } from '@/components/ui/input';

interface PaymentSectionProps {
  depositAvailable: boolean;
  paymentChoice: PaymentChoice;
  onPaymentChoice: (choice: PaymentChoice) => void;
  codeInput: string;
  onCodeInput: (code: string) => void;
  onApplyCode: () => void;
  codeMessage: string | null;
}

// How the guardian pays: in full or the Deposit first, when the Turnus has one, by bank transfer; and a
// Discount code.
export function PaymentSection(props: PaymentSectionProps) {
  const { t } = useTranslation('registration');

  return (
    <fieldset className="flex flex-col gap-4 rounded-lg border border-border p-4">
      <legend className="px-1 font-medium">{t('payment.title')}</legend>
      {props.depositAvailable ? (
        <div className="flex flex-col gap-2 text-sm">
          {PAYMENT_CHOICES.map((choice) => (
            <label key={choice} className="flex items-center gap-2">
              <input
                type="radio"
                name="paymentChoice"
                checked={props.paymentChoice === choice}
                onChange={() => props.onPaymentChoice(choice)}
              />
              {t(`payment.${choice}`)}
            </label>
          ))}
        </div>
      ) : null}
      <p className="text-sm text-muted-foreground">{t('payment.bankTransfer')}</p>
      <div className="flex flex-wrap items-end gap-2">
        <label className="flex flex-col gap-1 text-sm">
          {t('payment.code')}
          <Input
            value={props.codeInput}
            onChange={(event) => props.onCodeInput(event.target.value)}
            onBlur={props.onApplyCode}
          />
        </label>
      </div>
      {props.codeMessage === null ? null : <p className="text-sm">{props.codeMessage}</p>}
    </fieldset>
  );
}
