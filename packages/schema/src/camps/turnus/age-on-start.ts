// Why a child does not fit a Turnus's age limits, which the form shows at the birth date.
export const AGE_PROBLEMS = ['too_young', 'too_old'] as const;

export type AgeProblem = (typeof AGE_PROBLEMS)[number];

/**
 * Count a child's completed years on a Turnus's start date, both calendar dates.
 * @param birthDate YYYY-MM-DD
 * @param startDate YYYY-MM-DD
 */
export function ageOnStart(birthDate: string, startDate: string): number {
  const [birthYear, birthMonth, birthDay] = birthDate.split('-').map(Number) as [number, number, number];
  const [year, month, day] = startDate.split('-').map(Number) as [number, number, number];
  const hadBirthday = month > birthMonth || (month === birthMonth && day >= birthDay);

  return year - birthYear - (hadBirthday ? 0 : 1);
}

/**
 * Tell whether a child fits a Turnus's age limits by Age on start, both limits inclusive and either open.
 * @param birthDate YYYY-MM-DD
 * @param turnus its start date and limits
 */
export function ageProblem(
  birthDate: string,
  turnus: { readonly startDate: string; readonly minAge: number | null; readonly maxAge: number | null },
): AgeProblem | null {
  const age = ageOnStart(birthDate, turnus.startDate);

  if (turnus.minAge !== null && age < turnus.minAge) {
    return 'too_young';
  }

  return turnus.maxAge !== null && age > turnus.maxAge ? 'too_old' : null;
}
