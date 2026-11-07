import type { TFunction } from 'i18next';

/**
 * Split the time left into days, hours, minutes and seconds.
 * @param milliseconds time left, never below zero
 */
export function countdownOf(milliseconds: number): { days: number; hours: number; minutes: number; seconds: number } {
  const total = Math.max(0, Math.floor(milliseconds / 1000));

  return {
    days: Math.floor(total / 86_400),
    hours: Math.floor((total % 86_400) / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
  };
}

/**
 * Write a Turnus's age limits, either of which may be open.
 * @param t the translation function
 * @param min the youngest age, or null
 * @param max the oldest age, or null
 */
export function ageLimits(t: TFunction, min: number | null, max: number | null): string {
  if (min !== null && max !== null) {
    return t('campPage.ages', { min, max });
  }

  return min === null ? t('campPage.agesTo', { max }) : t('campPage.agesFrom', { min });
}
