import type { GuardianRegistration } from '@repo/schema/portal';

import { ChecklistCard } from '@/features/portal/components/home/checklist-card';
import { PaymentCard } from '@/features/portal/components/home/payment-card';
import { RegistrationLinks } from '@/features/portal/components/home/registration-links';
import { RegistrationSummary } from '@/features/portal/components/home/registration-summary';

// One Registration in the portal: its children, payments and how to pay the rest, what is left to do, and
// where to go next.
export function RegistrationCard({ registration }: { registration: GuardianRegistration }) {
  return (
    <article className="flex flex-col gap-4">
      <RegistrationSummary registration={registration} />
      <PaymentCard registration={registration} />
      <ChecklistCard registrationId={registration.id} />
      <RegistrationLinks registration={registration} />
    </article>
  );
}
