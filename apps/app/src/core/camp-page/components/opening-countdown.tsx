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

  // The page refetches the Turnusy each minute; until then the time up reads as opening, never as zeros.
  if (millisecondsLeft <= 0) {
    return <p className="text-sm font-medium">{t('campPage.openingNow')}</p>;
  }

  return (
    <p className="flex flex-wrap gap-x-2 text-sm">
      <span>{t('campPage.opensAt', { date: czechDateTime(opensAt) })}</span>
      <span className="font-medium tabular-nums">{t('campPage.countdown', left)}</span>
    </p>
  );
}
