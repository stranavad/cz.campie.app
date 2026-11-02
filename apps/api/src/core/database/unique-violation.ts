// PostgreSQL's code for a unique constraint violation.
const UNIQUE_VIOLATION = '23505';

/**
 * Name the unique constraint an error from the database violated, looking through the driver's wrapping.
 * @param error what a query threw
 */
export function violatedUniqueConstraint(error: unknown): string | null {
  for (let current = error; typeof current === 'object' && current !== null; current = causeOf(current)) {
    if ('code' in current && current.code === UNIQUE_VIOLATION && 'constraint' in current) {
      return typeof current.constraint === 'string' ? current.constraint : null;
    }
  }

  return null;
}

function causeOf(error: object): unknown {
  return 'cause' in error ? error.cause : undefined;
}
