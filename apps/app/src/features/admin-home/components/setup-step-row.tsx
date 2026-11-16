import { Link } from '@tanstack/react-router';
import { CheckIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { buttonVariants } from '@/components/ui/button';
import type { useSetupSteps } from '@/features/admin-home/components/use-setup-steps.hook';
import { cn } from '@/lib/utils';

interface SetupStepRowProps {
  step: NonNullable<ReturnType<typeof useSetupSteps>>['steps'][number];
}

// One setup step: done or not, what it is for, and a link to where it is done while it is not.
export function SetupStepRow({ step }: SetupStepRowProps) {
  const { t } = useTranslation('adminHome');
  const title = t(`setup.${step.key}.title`);

  return (
    <li className="flex flex-wrap items-center gap-x-3.5 gap-y-2 px-4 py-3.5">
      <span
        className={cn(
          'flex size-10 shrink-0 items-center justify-center rounded-[14px]',
          step.done ? 'bg-success text-success-foreground' : 'bg-muted text-nav-foreground',
        )}
      >
        {step.done ? <CheckIcon aria-hidden="true" className="size-5" strokeWidth={3} /> : null}
        <span className="sr-only">{t(step.done ? 'setup.done' : 'setup.missing')}</span>
      </span>
      <span className="flex min-w-0 flex-[1_1_10rem] flex-col leading-snug">
        <span className={cn('font-semibold', step.done && 'text-muted-foreground line-through')}>{title}</span>
        {step.done ? null : (
          <span className="text-[13px] text-muted-foreground">
            {t(step.link === null ? 'setup.ownerOnly' : `setup.${step.key}.detail`)}
          </span>
        )}
      </span>
      {step.done || step.link === null ? null : (
        <Link {...step.link} className={buttonVariants({ variant: 'outline', size: 'sm' })}>
          {t(`setup.${step.key}.action`)}
        </Link>
      )}
    </li>
  );
}
