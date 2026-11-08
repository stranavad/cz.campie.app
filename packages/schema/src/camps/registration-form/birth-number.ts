export interface ParsedBirthNumber {
  // As it is written and stored: RRMMDD/XXXX.
  readonly formatted: string;
  // YYYY-MM-DD.
  readonly birthDate: string;
  readonly gender: 'male' | 'female';
}

/**
 * Read a Czech rodné číslo (RRMMDD/XXXX, the slash and spaces optional): its birth date and gender, or
 * null when it is not a valid one. Women have 50 added to the month; from 2004, 20 more may be added when
 * a day's series runs out. Ten-digit numbers exist from 1954, so RR 54 to 99 is 19RR and 00 to 53 20RR;
 * nine-digit ones, of people born before 1954, are not taken. The number is divisible by 11, except that
 * until 1985 a remainder of 10 gave the check digit 0.
 * @param input the number as typed
 */
export function parseBirthNumber(input: string): ParsedBirthNumber | null {
  const digits = input.replace(/[\s/]/g, '');

  if (!/^\d{10}$/.test(digits)) {
    return null;
  }

  const yy = Number(digits.slice(0, 2));
  const mm = Number(digits.slice(2, 4));
  const dd = Number(digits.slice(4, 6));
  const year = yy >= 54 ? 1900 + yy : 2000 + yy;
  const reading =
    mm >= 1 && mm <= 12
      ? { gender: 'male' as const, month: mm }
      : mm >= 21 && mm <= 32 && year >= 2004
        ? { gender: 'male' as const, month: mm - 20 }
        : mm >= 51 && mm <= 62
          ? { gender: 'female' as const, month: mm - 50 }
          : mm >= 71 && mm <= 82 && year >= 2004
            ? { gender: 'female' as const, month: mm - 70 }
            : null;

  if (reading === null) {
    return null;
  }

  // A day out of range (00, 31 February) would roll into another month.
  const date = new Date(Date.UTC(year, reading.month - 1, dd));

  if (date.getUTCMonth() !== reading.month - 1 || date.getUTCDate() !== dd) {
    return null;
  }

  const remainder = Number(digits.slice(0, 9)) % 11;
  const checkDigit = Number(digits[9]);

  if (remainder !== checkDigit && !(remainder === 10 && checkDigit === 0 && year < 1986)) {
    return null;
  }

  const pad = (value: number) => String(value).padStart(2, '0');

  return {
    formatted: `${digits.slice(0, 6)}/${digits.slice(6)}`,
    birthDate: `${year}-${pad(reading.month)}-${pad(dd)}`,
    gender: reading.gender,
  };
}
