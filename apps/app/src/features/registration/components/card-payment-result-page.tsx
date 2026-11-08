import { Link } from '@tanstack/react-router';
import { CheckIcon, ClockIcon, HelpCircleIcon, XIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { IconTile } from '@/components/icon-tile';
import { buttonVariants } from '@/components/ui/button';
import { brandAttributes } from '@/core/branding';
import { useCardPaymentResultQuery } from '@/features/registration/api/registration.queries';

const STATES = {
  paid: { tone: 'success', icon: <CheckIcon strokeWidth={3} /> },
  pending: { tone: 'warning', icon: <ClockIcon /> },
  failed: { tone: 'danger', icon: <XIcon strokeWidth={3} /> },
} as const;

const CARD =
  'mt-6 mb-8 flex flex-col items-center gap-3 rounded-[28px] border border-border bg-card px-5 py-7 text-center';

// Where Comgate sends the guardian back: how the card payment ended, in the Camp's branding, with the way
// back to the Camp's website.
export function CardPaymentResultPage({ transactionId }: { transactionId: string }) {
  const { t } = useTranslation('registration');
  const result = useCardPaymentResultQuery(transactionId);

  if (transactionId === '' || result.isError) {
    return (
      <section className={CARD}>
        <IconTile className="size-16 rounded-full [&>svg]:size-8">
          <HelpCircleIcon />
        </IconTile>
        <p className="max-w-md">{t('cardResult.unknown')}</p>
      </section>
    );
  }

  if (result.data === undefined) {
    return <p className="py-12 text-center text-muted-foreground">{t('cardResult.loading')}</p>;
  }

  const { state, campName, logoUrl, websiteUrl, accentColour } = result.data;

  return (
    <section className={CARD} {...brandAttributes(accentColour)} aria-live="polite">
      {logoUrl === null ? null : (
        <img
          src={logoUrl}
          alt=""
          height={56}
          className="h-14 w-auto max-w-40 rounded-2xl bg-logo-plate object-contain p-1.5"
        />
      )}
      <IconTile tone={STATES[state].tone} className="size-18 rounded-full [&>svg]:size-9">
        {STATES[state].icon}
      </IconTile>
      <h1 className="text-title">{t(`cardResult.${state}.title`)}</h1>
      <p className="max-w-md text-muted-foreground">{t(`cardResult.${state}.text`, { camp: campName })}</p>
      <div className="mt-2 flex w-full flex-col gap-2">
        {websiteUrl === null ? null : (
          <a
            href={websiteUrl}
            className={buttonVariants({ variant: 'brand', size: 'lg', className: 'whitespace-normal' })}
          >
            {t('cardResult.website', { camp: campName })}
          </a>
        )}
        <Link
          to="/organisation/portal"
          className={buttonVariants({ variant: websiteUrl === null ? 'brand' : 'outline', size: 'lg' })}
        >
          {t('openPortal')}
        </Link>
      </div>
    </section>
  );
}
