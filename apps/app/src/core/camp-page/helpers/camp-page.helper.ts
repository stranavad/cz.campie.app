import type { TFunction } from 'i18next';

/**
 * Write a calendar date as Czech readers write it.
 * @param date YYYY-MM-DD
 */
export function czechDate(date: string): string {
  const [year, month, day] = date.split('-').map(Number);

  return `${day}. ${month}. ${year}`;
}

/**
 * Write a Prague date and time of an instant as Czech readers do.
 * @param instant ISO instant
 */
export function czechDateTime(instant: string): string {
  return new Intl.DateTimeFormat('cs-CZ', {
    timeZone: 'Europe/Prague',
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(instant));
}

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
 * Write whole CZK as Czech readers write money.
 * @param amount whole CZK
 */
export function czk(amount: number): string {
  return `${new Intl.NumberFormat('cs-CZ').format(amount)} Kč`;
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
