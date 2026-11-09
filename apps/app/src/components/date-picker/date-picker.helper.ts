import { czechDate } from '@repo/schema/shared';

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const ISO_DATE_TIME = /^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})/;
// "15. 6. 2027", "15.6.27", "15/6/2027" or just "15. 6.".
const TYPED_DATE = /^(\d{1,2})\s*[./]\s*(\d{1,2})\s*(?:[./]\s*(\d{2}|\d{4})?)?$/;
// A typed date followed by its time: "5. 7. 2027 8:30", also with the "·" the field shows.
const TYPED_DATE_TIME = /^(.+?)[\s·,]+(\d{1,2})[:.](\d{2})$/;

/**
 * Read a calendar date as a local midnight, so the calendar shows the same day in every time zone.
 * @param value the date as `YYYY-MM-DD`
 * @returns the date, or undefined when the text is not a real date
 */
export function dateFromIso(value: string): Date | undefined {
  const match = ISO_DATE.exec(value);

  if (match === null) {
    return undefined;
  }

  const [year, month, day] = [Number(match[1]), Number(match[2]) - 1, Number(match[3])];
  const date = new Date(year, month, day);

  return date.getFullYear() === year && date.getMonth() === month && date.getDate() === day ? date : undefined;
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

/**
 * Read a date the way Czech people type it: "15. 6. 2027", "15.6.27", or "15. 6." for this year.
 * @param text what was typed
 * @param currentYear the year a date typed without one falls in
 * @returns the date as `YYYY-MM-DD`, or undefined when the text is no real date
 */
export function parseCzechDate(text: string, currentYear: number): string | undefined {
  const trimmed = text.trim();

  if (ISO_DATE.test(trimmed)) {
    return dateFromIso(trimmed) === undefined ? undefined : trimmed;
  }

  const match = TYPED_DATE.exec(trimmed);

  if (match === null) {
    return undefined;
  }

  const typedYear = match[3];
  const year =
    typedYear === undefined ? currentYear : typedYear.length === 2 ? 2000 + Number(typedYear) : Number(typedYear);
  const iso = `${String(year).padStart(4, '0')}-${match[2]?.padStart(2, '0')}-${match[1]?.padStart(2, '0')}`;

  return dateFromIso(iso) === undefined ? undefined : iso;
}

/**
 * Read a date and time the way Czech people type them: "5. 7. 2027 8:30".
 * @param text what was typed
 * @param currentYear the year a date typed without one falls in
 * @returns the time as `YYYY-MM-DDTHH:mm`, or undefined when the text is no real date with a time
 */
export function parseCzechDateTime(text: string, currentYear: number): string | undefined {
  const trimmed = text.trim();
  const iso = ISO_DATE_TIME.exec(trimmed);
  const match = iso === null ? TYPED_DATE_TIME.exec(trimmed) : null;
  const [datePart, hour, minute] = iso === null ? [match?.[1], match?.[2], match?.[3]] : [iso[1], iso[2], iso[3]];

  if (
    datePart === undefined ||
    hour === undefined ||
    minute === undefined ||
    Number(hour) > 23 ||
    Number(minute) > 59
  ) {
    return undefined;
  }

  const date = parseCzechDate(datePart, currentYear);

  return date === undefined ? undefined : `${date}T${hour.padStart(2, '0')}:${minute}`;
}

/**
 * Write a date field's value as the field shows it.
 * @param value `YYYY-MM-DD`, or text that was typed and is no date
 * @returns "15. 6. 2027", or the typed text unchanged
 */
export function czechDateText(value: string): string {
  return dateFromIso(value) === undefined ? value : czechDate(value);
}

/**
 * Write a date-time field's value as the field shows it.
 * @param value `YYYY-MM-DDTHH:mm`, or text that was typed and is no date with a time
 * @returns "5. 7. 2027 8:30", or the typed text unchanged
 */
export function czechDateTimeText(value: string): string {
  const match = ISO_DATE_TIME.exec(value);

  if (match?.[1] === undefined || dateFromIso(match[1]) === undefined) {
    return value;
  }

  return `${czechDate(match[1])} ${Number(match[2])}:${match[3]}`;
}
