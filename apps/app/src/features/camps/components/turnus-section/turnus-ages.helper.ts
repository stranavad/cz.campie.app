import type { TFunction } from 'i18next';

import type { Turnus } from '@repo/schema/camps';

/**
 * Write a Turnus's age limits, either of which may be open; null when it has none.
 * @param t the translation function of the camps namespace
 * @param turnus the Turnus
 */
export function turnusAgesOf(t: TFunction<'camps'>, { minAge, maxAge }: Turnus): string | null {
  if (minAge !== null && maxAge !== null) {
    return t('turnus.ages', { min: minAge, max: maxAge });
  }

  if (minAge !== null) {
    return t('turnus.agesFrom', { min: minAge });
  }

  return maxAge === null ? null : t('turnus.agesTo', { max: maxAge });
}
