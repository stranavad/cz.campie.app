import { ClockIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { czechDateTime } from '@repo/schema/shared';

import { countdownOf } from '@/core/camp-page/helpers/camp-page.helper';
import { useNow } from '@/core/camp-page/hooks/use-now.hook';

interface OpeningCountdownProps {
  opensAt: string;
}

// When registration opens, and the time left until then.
export function OpeningCountdown({ opensAt }: OpeningCountdownProps) {
  const { t } = useTranslation();
  const millisecondsLeft = new Date(opensAt).getTime() - useNow();
  const left = countdownOf(millisecondsLeft);

  return (
    <div className="flex items-start gap-3 rounded-[20px] bg-brand-soft p-3 text-sm">
      <ClockIcon aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-brand-soft-foreground" />
      {/* The page refetches the Turnusy each minute; until then the time up reads as opening, never as zeros. */}
      {millisecondsLeft <= 0 ? (
        <p className="font-semibold">{t('campPage.openingNow')}</p>
      ) : (
        <p className="flex flex-col">
          <span>{t('campPage.opensAt', { date: czechDateTime(opensAt) })}</span>
          <span className="font-display text-base font-bold tabular-nums">{t('campPage.countdown', left)}</span>
        </p>
      )}
    </div>
  );
}
