const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * Read a calendar date as a local midnight, so the calendar shows the same day in every time zone.
 * @param value the date as `YYYY-MM-DD`
 * @returns the date, or undefined when the text is not a date
 */
export function dateFromIso(value: string): Date | undefined {
  const match = ISO_DATE.exec(value);

  if (match === null) {
    return undefined;
  }

  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

/**
 * Write a local date back as the calendar date the forms and the API use.
 * @param date the picked day
 * @returns the date as `YYYY-MM-DD`
 */
export function isoFromDate(date: Date): string {
  return [
    String(date.getFullYear()).padStart(4, '0'),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
}

/**
 * Keep a shown month inside the bounds the picker allows.
 * @param month any day of the month to show
 * @param min the earliest allowed day, if any
 * @param max the latest allowed day, if any
 * @returns the first day of the month, moved into the bounds
 */
export function clampMonth(month: Date, min: Date | undefined, max: Date | undefined): Date {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);

  if (min !== undefined && first < new Date(min.getFullYear(), min.getMonth(), 1)) {
    return new Date(min.getFullYear(), min.getMonth(), 1);
  }

  if (max !== undefined && first > new Date(max.getFullYear(), max.getMonth(), 1)) {
    return new Date(max.getFullYear(), max.getMonth(), 1);
  }

  return first;
}

// Every quarter of an hour, the times the time picker offers.
export const QUARTER_HOURS = Array.from(
  { length: 96 },
  (_, index) => `${String(Math.floor(index / 4)).padStart(2, '0')}:${String((index % 4) * 15).padStart(2, '0')}`,
);
