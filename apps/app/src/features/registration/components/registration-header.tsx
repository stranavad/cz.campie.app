import { Link } from '@tanstack/react-router';
import { ChevronLeftIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import type { PublicCamp, PublicTurnus } from '@repo/schema/camps';
import { czechDate } from '@repo/schema/shared';

import { BackHeader } from '@/components/back-header';
import { StepProgress } from '@/components/step-progress';
import { REGISTRATION_STEPS } from '@/features/registration/components/registration-step.constant';

interface RegistrationHeaderProps {
  camp: PublicCamp;
  turnus: PublicTurnus | undefined;
  // 1-based.
  step: number;
}

// The top of the form: back a step (from the first, back to the Camp), the Camp and Turnus, and how far
// the guardian is.
export function RegistrationHeader({ camp, turnus, step }: RegistrationHeaderProps) {
  const { t } = useTranslation('registration');
  const names = REGISTRATION_STEPS.map((name) => t(`steps.${name}.name`));

  return (
    <div className="flex flex-col gap-1.5">
      <BackHeader
        back={(className) =>
          step === 1 ? (
            <Link
              to="/organisation/$campSlug"
              params={{ campSlug: camp.slug }}
              className={className}
              aria-label={t('back', { camp: camp.name })}
            >
              <ChevronLeftIcon aria-hidden="true" />
            </Link>
          ) : (
            <Link
              to="/organisation/$campSlug/prihlaska"
              params={{ campSlug: camp.slug }}
              search={(previous) => ({ ...previous, krok: step === 2 ? undefined : step - 1 })}
              className={className}
              aria-label={t('steps.back', { step: names[step - 2] })}
            >
              <ChevronLeftIcon aria-hidden="true" />
            </Link>
          )
        }
        title={t('screenTitle')}
        subtitle={
          turnus === undefined
            ? camp.name
            : t('header', {
                camp: camp.name,
                turnus: t('turnusOption', {
                  name: turnus.name,
                  start: czechDate(turnus.startDate),
                  end: czechDate(turnus.endDate),
                }),
              })
        }
      />
      <StepProgress
        className="px-1"
        current={step}
        total={REGISTRATION_STEPS.length}
        label={t('steps.progress', { current: step, total: REGISTRATION_STEPS.length, names: names.join(' → ') })}
      />
    </div>
  );
}
