import { Link } from '@tanstack/react-router';
import { CheckIcon, ClockIcon, HelpCircleIcon, XIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { czk } from '@repo/schema/shared';

import { IconTile } from '@/components/icon-tile';
import { buttonVariants } from '@/components/ui/button';
import { brandAttributes } from '@/core/branding';
import { TransferDetails } from '@/core/transfer-details';
import { useCardPaymentResultQuery } from '@/features/registration/api/registration.queries';
import { joinNames } from '@/features/registration/components/names.helper';

const STATES = {
  paid: { tone: 'success', icon: <CheckIcon strokeWidth={3} /> },
  pending: { tone: 'warning', icon: <ClockIcon /> },
  failed: { tone: 'danger', icon: <XIcon strokeWidth={3} /> },
} as const;

const CARD =
  'mt-6 mb-8 flex flex-col items-center gap-3 rounded-[28px] border border-border bg-card px-5.5 py-7 text-center sm:px-8';

interface CardPaymentResultPageProps {
  transactionId: string;
}

// Where Comgate sends the guardian back: how the card payment ended, what it was for and for whom, in the
// Camp's branding, and the way back to the portal. A failed payment is retried from the portal, or paid by
// transfer with the QR platba shown here; a pending one shows none, so it is not paid twice.
export function CardPaymentResultPage({ transactionId }: CardPaymentResultPageProps) {
  const { t } = useTranslation('registration');
  const result = useCardPaymentResultQuery(transactionId);

  if (transactionId === '' || result.isError) {
    return (
      <section className={CARD}>
        <IconTile className="size-18 rounded-full [&>svg]:size-9">
          <HelpCircleIcon />
        </IconTile>
        <p className="max-w-md">{t('cardResult.unknown')}</p>
        <Link
          to="/organisation/portal"
          className={buttonVariants({ variant: 'brand', size: 'lg', className: 'mt-1.5 w-full max-w-sm' })}
        >
          {t('cardResult.portal')}
        </Link>
      </section>
    );
  }

  if (result.data === undefined) {
    return <p className="py-12 text-center text-muted-foreground">{t('cardResult.loading')}</p>;
  }

  const { state, campName, websiteUrl, accentColour, amount, firstNames, variableSymbol, payment } = result.data;

  return (
    <section className={CARD} {...brandAttributes(accentColour)} aria-live="polite">
      <IconTile tone={STATES[state].tone} className="size-18 rounded-full [&>svg]:size-9">
        {STATES[state].icon}
      </IconTile>
      <h1 className="text-title">{t(`cardResult.${state}.title`)}</h1>
      <p className="max-w-md text-muted-foreground">{t(`cardResult.${state}.text`, { camp: campName })}</p>
      <p className="max-w-md font-semibold">
        {t('cardResult.summary', { amount: czk(amount), participants: joinNames(firstNames), variableSymbol })}
      </p>
      {state === 'failed' && payment !== null ? (
        <div className="w-full max-w-sm text-left">
          <TransferDetails payment={payment} variableSymbol={variableSymbol} />
        </div>
      ) : null}
      <div className="mt-1.5 flex w-full max-w-sm flex-col gap-2">
        <Link
          to="/organisation/portal"
          className={buttonVariants({ variant: 'brand', size: 'lg', className: 'w-full' })}
        >
          {state === 'failed' ? t('cardResult.retry') : t('cardResult.portal')}
        </Link>
        {websiteUrl === null ? null : (
          <a
            href={websiteUrl}
            className={buttonVariants({ variant: 'outline', size: 'lg', className: 'w-full whitespace-normal' })}
          >
            {t('cardResult.website', { camp: campName })}
          </a>
        )}
      </div>
    </section>
  );
}
