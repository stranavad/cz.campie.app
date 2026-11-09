import { useTranslation } from 'react-i18next';

import type { RegistrationDetail } from '@repo/schema/registrations';
import { czechDate, czk } from '@repo/schema/shared';

// The payments card's headline: what is left to pay and by when, or that nothing or too much was paid.
export function useBalanceLine(ledger: RegistrationDetail['ledger']) {
  const { t } = useTranslation('participants');
  const { balance, amountDue } = ledger;

  if (balance < 0) {
    return { amount: czk(-balance), caption: t('detail.overpaidBy') };
  }

  if (balance === 0) {
    return { amount: czk(0), caption: t('detail.settled') };
  }

  const date = amountDue.dueDate === null ? null : czechDate(amountDue.dueDate);

  // The Deposit falls due first; the rest later.
  if (amountDue.phase === 'deposit' && date !== null) {
    return { amount: czk(balance), caption: t('detail.leftDeposit', { amount: czk(amountDue.amount), date }) };
  }

  return { amount: czk(balance), caption: date === null ? t('detail.left') : t('detail.leftBy', { date }) };
}
