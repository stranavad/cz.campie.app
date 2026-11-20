// The hub's deadline calculator: the day a step of the timeline falls on, counted from the camp's first
// day, and how far it is from today. Pure, shared by pages.ts (the labels it hands the page) and the
// browser script src/scripts/deadlines.ts. Days are UTC midnights, so no time zone or summer time shifts
// them.

export type Offset = { months: number } | { days: number };

// The words of the calculator, from hub.timeline.calculator.
export interface DeadlineLabels {
  start: string;
  empty: string;
  today: string;
  tomorrow: string;
  past: string;
  inDays: readonly [string, string];
}

const DAY = 86_400_000;

// "2027-07-12" to its day, or null for anything else (an empty or half-typed field).
export function parseDay(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (match === null) {
    return null;
  }
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCMonth() === month - 1 && date.getUTCDate() === day ? date : null;
}

// The day of a step. Months keep the day of the month, or take the month's last day when it is shorter:
// a month before 31 March is 28 (or 29) February, not 3 March.
export function shiftDay(start: Date, offset: Offset): Date {
  if ('days' in offset) {
    return new Date(start.getTime() + offset.days * DAY);
  }
  const year = start.getUTCFullYear();
  const month = start.getUTCMonth() + offset.months;
  const last = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  return new Date(Date.UTC(year, month, Math.min(start.getUTCDate(), last)));
}

// "12. 7. 2027", as Czech writes a date.
export function czechDay(date: Date): string {
  return `${date.getUTCDate()}. ${date.getUTCMonth() + 1}. ${date.getUTCFullYear()}`;
}

export const fill = (template: string, values: Record<string, string | number>) =>
  template.replace(/\{(\w+)\}/g, (whole, key: string) => (key in values ? String(values[key]) : whole));

// "dnes", "zítra", "za 3 dny", "za 12 dní" or "už proběhlo".
export function distance(today: Date, day: Date, labels: DeadlineLabels): string {
  const days = Math.round((day.getTime() - today.getTime()) / DAY);
  if (days < 0) {
    return labels.past;
  }
  if (days === 0) {
    return labels.today;
  }
  if (days === 1) {
    return labels.tomorrow;
  }
  return fill(labels.inDays[days <= 4 ? 0 : 1], { n: days });
}
