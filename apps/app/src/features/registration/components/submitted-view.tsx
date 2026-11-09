import { Link } from '@tanstack/react-router';
import { CheckIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import type { PublicCamp, PublicTurnus } from '@repo/schema/camps';
import type { Answers } from '@repo/schema/form-engine';
import type { SubmittedRegistration } from '@repo/schema/registrations';
import { czechDate } from '@repo/schema/shared';

import { IconTile } from '@/components/icon-tile';
import { buttonVariants } from '@/components/ui/button';
import { joinNames } from '@/features/registration/components/names.helper';
import { NextSteps } from '@/features/registration/components/next-steps';
import { SubmittedPaymentCard } from '@/features/registration/components/submitted-payment-card';
import { SubmittedPrihlasky } from '@/features/registration/components/submitted-prihlasky';

interface SubmittedViewProps {
  camp: PublicCamp;
  turnus: PublicTurnus;
  participants: readonly Answers[];
  registration: Answers;
  submitted: SubmittedRegistration;
  submittedKey: string;
  cardStatus: 'redirecting' | 'failed' | null;
}

// What a guardian sees once the Registration is in: who has a place where, how to pay right away, the
// Přihlášky to download, and what follows.
export function SubmittedView({
  camp,
  turnus,
  participants,
  registration,
  submitted,
  submittedKey,
  cardStatus,
}: SubmittedViewProps) {
  const { t } = useTranslation('registration');
  const children = participants.map((answers) => (typeof answers.firstName === 'string' ? answers.firstName : ''));

  return (
    <div className="flex flex-col gap-4 pt-6 pb-8" aria-live="polite">
      <section className="flex flex-col items-start gap-2.5 px-1">
        <IconTile tone="success" className="size-14 rounded-full [&>svg]:size-7">
          <CheckIcon strokeWidth={3} />
        </IconTile>
        <h1 className="text-title">{t('submitted.title')}</h1>
        <p className="text-muted-foreground">
          {t('submitted.placed', {
            count: children.length,
            children: joinNames(children),
            camp: camp.name,
            turnus: t('turnusOption', {
              name: turnus.name,
              start: czechDate(turnus.startDate),
              end: czechDate(turnus.endDate),
            }),
          })}
        </p>
        {typeof registration.guardianEmail === 'string' ? (
          <p className="text-muted-foreground">
            {t('submitted.confirmation', { email: registration.guardianEmail.trim() })}
          </p>
        ) : null}
      </section>
      <SubmittedPaymentCard submitted={submitted} cardStatus={cardStatus} />
      <SubmittedPrihlasky slug={camp.slug} submittedKey={submittedKey} firstNames={children} />
      <NextSteps submitted={submitted} />
      <Link to="/organisation/portal" className={buttonVariants({ variant: 'outline', size: 'lg' })}>
        {t('openPortal')}
      </Link>
    </div>
  );
}
