import { useTranslation } from 'react-i18next';

import type { GuardianRegistration } from '@repo/schema/portal';
import { czechDate, czk } from '@repo/schema/shared';

/**
 * What a Registration's payment card says: the amount left, what it means and by when, and how much is paid.
 * @param registration the guardian's Registration
 */
export function usePaymentCard(registration: GuardianRegistration) {
  const { t } = useTranslation('portal');
  const { payment } = registration;
  const isOverpaid = registration.balance < 0;
  const discount = -registration.priceLines.reduce((sum, line) => (line.amount < 0 ? sum + line.amount : sum), 0);
  const paidOf = { paid: czk(registration.paid), total: czk(registration.total) };

  // Under an Invoice request the guardian owes only their share: all of it outstanding, else what is due now.
  const owed =
    payment.invoiced === null ? Math.abs(registration.balance) : (payment.balance?.outstanding ?? payment.amount);

  return {
    amount: czk(owed),
    // Under the amount: what is due now and by when, else what the amount is.
    meaning:
      isOverpaid && payment.invoiced === null
        ? t('overpaidLine')
        : payment.amount === 0 || payment.dueDate === null
          ? t('balanceLine')
          : payment.phase === 'deposit'
            ? t('depositBy', { amount: czk(payment.amount), date: czechDate(payment.dueDate) })
            : t('payBy', { amount: czk(payment.amount), date: czechDate(payment.dueDate) }),
    paidLine: discount > 0 ? t('paidOfWithDiscount', { ...paidOf, discount: czk(discount) }) : t('paidOf', paidOf),
    hasTotal: registration.total > 0,
    isOverdue: registration.overdue && payment.amount !== 0,
    hasSomethingToPay: payment.amount !== 0,
  };
}
