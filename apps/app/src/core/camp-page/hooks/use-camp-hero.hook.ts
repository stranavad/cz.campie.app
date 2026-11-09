import { useTranslation } from 'react-i18next';

import type { PublicTurnus } from '@repo/schema/camps';

import { ageLimits, ageRangeOf, lengthOf, placesOf } from '@/core/camp-page/helpers/camp-page.helper';

/**
 * What a Camp's hero says at a glance, from its Turnusy: where they take place, for what ages, how long.
 * @param turnusy the Camp's Turnusy
 */
export function useCampHero(turnusy: readonly PublicTurnus[]): string[] {
  const { t } = useTranslation();
  const ages = ageRangeOf(turnusy);
  const length = lengthOf(turnusy);

  return [
    ...placesOf(turnusy),
    ages.min === null && ages.max === null ? null : ageLimits(t, ages.min, ages.max),
    length === null
      ? null
      : length.min === length.max
        ? t('campPage.length', { count: length.min })
        : t('campPage.lengthRange', { min: length.min, max: length.max }),
  ].filter((chip) => chip !== null);
}
