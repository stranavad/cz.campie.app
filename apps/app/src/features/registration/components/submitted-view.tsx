import { Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

import type { PublicCamp } from '@repo/schema/camps';
import type { SubmittedRegistration } from '@repo/schema/registrations';
import { czk } from '@repo/schema/shared';

interface SubmittedViewProps {
  camp: PublicCamp;
  submitted: SubmittedRegistration;
}

// What a guardian sees once the Registration is in: its Variable symbol and what it costs; the payment
// details follow by email.
export function SubmittedView({ camp, submitted }: SubmittedViewProps) {
  const { t } = useTranslation('registration');

  return (
    <section className="flex flex-col gap-4 py-12" aria-live="polite">
      <h1 className="text-2xl font-semibold">{t('submitted.title')}</h1>
      <p>{t('submitted.placed', { camp: camp.name })}</p>
      <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-1">
        <dt className="text-muted-foreground">{t('submitted.variableSymbol')}</dt>
        <dd className="font-medium tabular-nums">{submitted.variableSymbol}</dd>
        <dt className="text-muted-foreground">{t('price.total')}</dt>
        <dd className="font-medium tabular-nums">{czk(submitted.total)}</dd>
        {submitted.depositTotal === null ? null : (
          <>
            <dt className="text-muted-foreground">{t('submitted.depositFirst')}</dt>
            <dd className="font-medium tabular-nums">{czk(submitted.depositTotal)}</dd>
          </>
        )}
      </dl>
      <p className="text-sm text-muted-foreground">{t('submitted.email')}</p>
      <Link to="/organisation/$campSlug" params={{ campSlug: camp.slug }} className="text-sm underline">
        {t('back', { camp: camp.name })}
      </Link>
    </section>
  );
}
