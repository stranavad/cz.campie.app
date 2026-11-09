import { TriangleAlertIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import type { GuardianRegistration } from '@repo/schema/portal';

import { Alert } from '@/components/ui/alert';
import { useRegistrationSummary } from '@/features/portal/components/home/use-registration-summary.hook';

interface RegistrationSummaryProps {
  registration: GuardianRegistration;
}

// Whom a Registration places and where: the children by first name, the Camp, Turnus and its dates.
export function RegistrationSummary({ registration }: RegistrationSummaryProps) {
  const { t } = useTranslation('portal');
  const summary = useRegistrationSummary(registration);

  return (
    <header className="flex flex-col gap-1 px-1">
      <h2 className="font-display text-2xl leading-tight font-extrabold tracking-[-0.02em] break-words">
        {summary.title}
      </h2>
      <p className="text-[15px] text-muted-foreground">{summary.where}</p>
      {summary.cancelledNote === null ? null : <p className="text-sm text-muted-foreground">{summary.cancelledNote}</p>}
      {registration.undeliverableEmails.length === 0 ? null : (
        <Alert variant="warning" role="alert" className="mt-2 wrap-anywhere">
          <TriangleAlertIcon aria-hidden="true" />
          {t('undeliverable', { emails: registration.undeliverableEmails.join(', ') })}
        </Alert>
      )}
    </header>
  );
}
