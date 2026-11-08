import { useId } from 'react';
import { useTranslation } from 'react-i18next';

import { PAYMENT_CHOICES, type PaymentChoice } from '@repo/schema/pricing';

import { Card, CardTitle } from '@/components/ui/card';
import { Field, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { ChoiceChips } from '@/core/registration-form';

interface PaymentSectionProps {
  depositAvailable: boolean;
  paymentChoice: PaymentChoice;
  onPaymentChoice: (choice: PaymentChoice) => void;
  codeInput: string;
  onCodeInput: (code: string) => void;
  onApplyCode: () => void;
  codeMessage: string | null;
  cardOffered: boolean;
  byCard: boolean;
  onByCard: (byCard: boolean) => void;
}

// How the guardian pays: in full or the Deposit first, when the Turnus has one; by bank transfer, or by
// card when the Organisation takes cards; and a Discount code.
export function PaymentSection(props: PaymentSectionProps) {
  const { t } = useTranslation('registration');
  const codeId = useId();
  const methods = [
    { id: 'transfer', byCard: false, label: t('payment.methodTransfer') },
    { id: 'card', byCard: true, label: t('payment.methodCard') },
  ];

  return (
    <Card>
      <CardTitle>{t('payment.title')}</CardTitle>
      {props.depositAvailable ? (
        <ChoiceChips
          caption={t('payment.amount')}
          multiple={false}
          choices={PAYMENT_CHOICES.map((choice) => ({
            id: choice,
            label: t(`payment.${choice}`),
            checked: props.paymentChoice === choice,
            pick: () => props.onPaymentChoice(choice),
            clear: null,
          }))}
        />
      ) : null}
      {props.cardOffered ? (
        <ChoiceChips
          caption={t('payment.method')}
          multiple={false}
          choices={methods.map((method) => ({
            id: method.id,
            label: method.label,
            checked: props.byCard === method.byCard,
            pick: () => props.onByCard(method.byCard),
            clear: null,
          }))}
        />
      ) : null}
      <p className="text-sm text-muted-foreground">
        {props.byCard ? t('payment.cardNote') : t('payment.bankTransfer')}
      </p>
      <Field>
        <FieldLabel htmlFor={codeId}>{t('payment.code')}</FieldLabel>
        <Input
          id={codeId}
          value={props.codeInput}
          onChange={(event) => props.onCodeInput(event.target.value)}
          onBlur={props.onApplyCode}
        />
      </Field>
      {props.codeMessage === null ? null : (
        <output className="block rounded-[14px] bg-muted px-3 py-2.5 text-sm font-medium">{props.codeMessage}</output>
      )}
    </Card>
  );
}
