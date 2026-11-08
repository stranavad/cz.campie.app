import { Link } from '@tanstack/react-router';
import { CheckIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import type { PublicCamp } from '@repo/schema/camps';
import type { SubmittedRegistration } from '@repo/schema/registrations';
import { czk } from '@repo/schema/shared';

import { IconTile } from '@/components/icon-tile';
import { Alert } from '@/components/ui/alert';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardTitle } from '@/components/ui/card';
import { DescriptionItem, DescriptionList } from '@/components/ui/description-list';
import { NextSteps } from '@/features/registration/components/next-steps';

interface SubmittedViewProps {
  camp: PublicCamp;
  submitted: SubmittedRegistration;
  cardStatus: 'redirecting' | 'failed' | null;
}

// What a guardian sees once the Registration is in: its Variable symbol and what it costs; the payment
// details follow by email.
export function SubmittedView({ camp, submitted, cardStatus }: SubmittedViewProps) {
  const { t } = useTranslation('registration');

  return (
    <div className="flex flex-col gap-4 pt-6 pb-8" aria-live="polite">
      <section className="flex flex-col items-center gap-3 px-2 text-center">
        <IconTile tone="success" className="size-16 rounded-full [&>svg]:size-8">
          <CheckIcon strokeWidth={3} />
        </IconTile>
        <h1 className="text-title">{t('submitted.title')}</h1>
        <p className="text-muted-foreground">{t('submitted.placed', { camp: camp.name })}</p>
      </section>
      {cardStatus === 'redirecting' ? <Alert variant="brand">{t('submitted.cardRedirecting')}</Alert> : null}
      {cardStatus === 'failed' ? <Alert variant="danger">{t('submitted.cardFailed')}</Alert> : null}
      <Card>
        <CardTitle>{t('submitted.paymentTitle')}</CardTitle>
        <DescriptionList>
          <DescriptionItem label={t('submitted.variableSymbol')}>
            <span className="font-display text-xl font-extrabold tabular-nums">{submitted.variableSymbol}</span>
          </DescriptionItem>
          <DescriptionItem label={t('price.total')}>
            <span className="tabular-nums">{czk(submitted.total)}</span>
          </DescriptionItem>
          {submitted.depositTotal === null ? null : (
            <DescriptionItem label={t('submitted.depositFirst')}>
              <span className="tabular-nums">{czk(submitted.depositTotal)}</span>
            </DescriptionItem>
          )}
        </DescriptionList>
        <p className="text-sm text-muted-foreground">{t('submitted.email')}</p>
      </Card>
      <NextSteps />
      <div className="flex flex-col gap-2">
        <Link to="/organisation/portal" className={buttonVariants({ variant: 'outline', size: 'lg' })}>
          {t('openPortal')}
        </Link>
        <Link
          to="/organisation/$campSlug"
          params={{ campSlug: camp.slug }}
          className={buttonVariants({ variant: 'ghost', className: 'whitespace-normal' })}
        >
          {t('back', { camp: camp.name })}
        </Link>
      </div>
    </div>
  );
}
