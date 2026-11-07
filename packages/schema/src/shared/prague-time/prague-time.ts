import { z } from 'zod';

import { isPlausibleDate } from '../primitives/primitives.schema.ts';

// Every calendar rule of the platform (Registration window, Early bird, Age on start) runs on the Prague
// calendar, whatever the server's or the browser's zone.
const ZONE = 'Europe/Prague';
const DAY_MS = 24 * 60 * 60 * 1000;

const formatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
});

const PRAGUE_LOCAL = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/;

// A Prague wall-clock date and time to the minute, as a datetime-local input writes it: 2027-03-01T10:00.
// Admins enter the Registration window this way, so it travels as such, not as an instant.
export const pragueLocalSchema = z.string().refine((value) => {
  const match = PRAGUE_LOCAL.exec(value);

  if (match === null) {
    return false;
  }

  const [, year, month, day, hour, minute] = match.map(Number) as [number, number, number, number, number, number];

  return isPlausibleDate(year, month, day) && hour < 24 && minute < 60;
}, 'prague_local_invalid');

/**
 * Read an instant's Prague wall-clock fields.
 * @param instant the instant
 */
function pragueFields(instant: Date): Record<'year' | 'month' | 'day' | 'hour' | 'minute' | 'second', string> {
  const parts = Object.fromEntries(formatter.formatToParts(instant).map(({ type, value }) => [type, value]));

  return {
    year: parts.year ?? '',
    month: parts.month ?? '',
    day: parts.day ?? '',
    hour: parts.hour ?? '',
    minute: parts.minute ?? '',
    second: parts.second ?? '',
  };
}

/**
 * Tell the calendar date an instant falls on in Prague.
 * @param instant the instant
 * @returns YYYY-MM-DD
 */
export function pragueDateOf(instant: Date): string {
  const { year, month, day } = pragueFields(instant);

  return `${year}-${month}-${day}`;
}

/**
 * Write an instant as Prague wall-clock time to the minute.
 * @param instant the instant
 * @returns YYYY-MM-DDTHH:mm
 */
export function pragueLocalOf(instant: Date): string {
  const { year, month, day, hour, minute } = pragueFields(instant);

  return `${year}-${month}-${day}T${hour}:${minute}`;
}

/**
 * Tell how far Prague's clock is ahead of UTC at an instant.
 * @param instant the instant
 */
function offsetAt(instant: Date): number {
  const { year, month, day, hour, minute, second } = pragueFields(instant);
  const wall = Date.UTC(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute), Number(second));

  return wall - Math.floor(instant.getTime() / 1000) * 1000;
}

/**
 * Find the instant a Prague wall-clock time stands for. A time that happens twice when the clocks go back
 * is the first one; a time skipped when they go forward is read with the offset before the change, as the
 * clock shows it an hour later.
 * @param local YYYY-MM-DDTHH:mm
 * @throws {Error} when the text is not a Prague local date and time
 */
export function instantFromPragueLocal(local: string): Date {
  const match = PRAGUE_LOCAL.exec(local);

  if (match === null) {
    throw new Error(`Not a Prague local date and time: ${local}`);
  }

  const [, year, month, day, hour, minute] = match.map(Number) as [number, number, number, number, number, number];
  const wall = Date.UTC(year, month - 1, day, hour, minute);
  const before = offsetAt(new Date(wall - DAY_MS));
  const after = offsetAt(new Date(wall + DAY_MS));
  const matching = [...new Set([before, after])]
    .map((offset) => wall - offset)
    .filter((candidate) => pragueLocalOf(new Date(candidate)) === local);

  return new Date(matching.length === 0 ? wall - before : Math.min(...matching));
}

/**
 * Move a calendar date by whole days.
 * @param date YYYY-MM-DD
 * @param days how many days, negative for earlier
 * @returns YYYY-MM-DD
 */
export function addDays(date: string, days: number): string {
  const [year, month, day] = date.split('-').map(Number) as [number, number, number];

  return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10);
}
