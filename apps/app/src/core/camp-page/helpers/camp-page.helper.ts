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
 * Write age limits, either of which may be open.
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

/**
 * The ages a Camp's Turnusy take together: the youngest lower limit and the oldest upper one, each open when
 * any Turnus leaves it open.
 * @param turnusy the Camp's Turnusy
 */
export function ageRangeOf(turnusy: readonly { minAge: number | null; maxAge: number | null }[]): {
  min: number | null;
  max: number | null;
} {
  const mins = turnusy.map(({ minAge }) => minAge);
  const maxes = turnusy.map(({ maxAge }) => maxAge);

  return {
    min: mins.length > 0 && mins.every((age): age is number => age !== null) ? Math.min(...mins) : null,
    max: maxes.length > 0 && maxes.every((age): age is number => age !== null) ? Math.max(...maxes) : null,
  };
}

/**
 * How many days a Camp's Turnusy last, first and last day included: the shortest and the longest.
 * @param turnusy the Camp's Turnusy, with ISO calendar dates
 */
export function lengthOf(turnusy: readonly { startDate: string; endDate: string }[]): {
  min: number;
  max: number;
} | null {
  const days = turnusy.map(({ startDate, endDate }) => (Date.parse(endDate) - Date.parse(startDate)) / 86_400_000 + 1);

  return days.length === 0 ? null : { min: Math.min(...days), max: Math.max(...days) };
}

/**
 * List the places a Camp's Turnusy take place at, each once, in their order.
 * @param turnusy the Camp's Turnusy
 */
export function placesOf(turnusy: readonly { place: string }[]): string[] {
  return [...new Set(turnusy.map(({ place }) => place.trim()).filter((place) => place !== ''))];
}
