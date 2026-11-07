import { useTranslation } from 'react-i18next';

import { brandTokens } from '@/core/organisation-shell/brand-tokens.helper';
import { useCardPaymentResultQuery } from '@/features/registration/api/registration.queries';

// Where Comgate sends the guardian back: how the card payment ended, in the Camp's branding, with the way
// back to the Camp's website.
export function CardPaymentResultPage({ transactionId }: { transactionId: string }) {
  const { t } = useTranslation('registration');
  const result = useCardPaymentResultQuery(transactionId);

  if (transactionId === '' || result.isError) {
    return <p className="py-12">{t('cardResult.unknown')}</p>;
  }

  if (result.data === undefined) {
    return <p className="py-12 text-muted-foreground">{t('cardResult.loading')}</p>;
  }

  const { state, campName, logoUrl, websiteUrl, accentColour } = result.data;

  return (
    <section className="flex flex-col gap-4 py-12" style={brandTokens(accentColour)} aria-live="polite">
      {logoUrl === null ? null : <img src={logoUrl} alt="" className="h-16 w-auto self-start" />}
      <h1 className="text-2xl font-semibold">{t(`cardResult.${state}.title`)}</h1>
      <p>{t(`cardResult.${state}.text`, { camp: campName })}</p>
      {websiteUrl === null ? null : (
        <a href={websiteUrl} className="self-start font-medium text-primary underline">
          {t('cardResult.website', { camp: campName })}
        </a>
      )}
    </section>
  );
}
