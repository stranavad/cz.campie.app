import { useTranslation } from 'react-i18next';

import type { GuardianRegistration } from '@repo/schema/portal';

import { ChecklistCard } from '@/features/portal/components/home/checklist-card';
import { PaymentCard } from '@/features/portal/components/home/payment-card';
import { RegistrationLinks } from '@/features/portal/components/home/registration-links';
import { RegistrationSummary } from '@/features/portal/components/home/registration-summary';

// One Registration in the portal: its children, what is left to do, payments and how to pay the rest.
export function RegistrationCard({ registration }: { registration: GuardianRegistration }) {
  const { t } = useTranslation('portal');

  return (
    <article className="flex flex-col gap-3">
      <RegistrationSummary registration={registration} />
      <PaymentCard registration={registration} />
      <ChecklistCard registrationId={registration.id} />
      <RegistrationLinks registration={registration} />
      <footer className="px-1 text-[13px] wrap-anywhere text-muted-foreground">
        {registration.camp.contactPhone === null
          ? t('campContact', { email: registration.camp.contactEmail })
          : t('campContactWithPhone', { email: registration.camp.contactEmail, phone: registration.camp.contactPhone })}
      </footer>
    </article>
  );
}
