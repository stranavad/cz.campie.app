// PostgreSQL's codes for the constraint violations the app answers with a code of its own.
const VIOLATION_CODES = { unique: '23505', check: '23514' } as const;

export type ConstraintKind = keyof typeof VIOLATION_CODES;

/**
 * Name the constraint of a kind an error from the database violated, looking through the driver's wrapping.
 * @param error what a query threw
 * @param kind the kind of constraint
 */
export function violatedConstraint(error: unknown, kind: ConstraintKind): string | null {
  for (let current = error; typeof current === 'object' && current !== null; current = causeOf(current)) {
    if ('code' in current && current.code === VIOLATION_CODES[kind] && 'constraint' in current) {
      return typeof current.constraint === 'string' ? current.constraint : null;
    }
  }

  return null;
}

function causeOf(error: object): unknown {
  return 'cause' in error ? error.cause : undefined;
}
