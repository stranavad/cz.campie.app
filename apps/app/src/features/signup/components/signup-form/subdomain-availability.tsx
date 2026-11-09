import { useTranslation } from 'react-i18next';

import { useSubdomainAvailability } from '@/features/signup/components/signup-form/use-subdomain-availability.hook';

interface SubdomainAvailabilityProps {
  // The subdomain field's value as typed.
  value: string;
}

// "Adresa je volná" under the subdomain field while the Owner types, or why it is not.
export function SubdomainAvailability({ value }: SubdomainAvailabilityProps) {
  const { t } = useTranslation(['signup', 'common']);
  const { isAvailable, refusal, isUnchecked } = useSubdomainAvailability(value);

  return (
    <p aria-live="polite" className="text-sm empty:hidden">
      {isAvailable && <span className="text-success-foreground">{t('camp.subdomainAvailable')}</span>}
      {refusal !== null && (
        <span className="text-danger-foreground">{t(`validation.${refusal}`, { ns: 'common' })}</span>
      )}
      {isUnchecked && <span className="text-muted-foreground">{t('camp.subdomainUnchecked')}</span>}
    </p>
  );
}
