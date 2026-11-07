// PostgreSQL's code for a lock not granted within `lock_timeout`.
const LOCK_NOT_AVAILABLE = '55P03';

/**
 * Tell whether an error from the database is a lock wait that gave up, looking through the driver's wrapping.
 * @param error what a query threw
 */
export function lockTimedOut(error: unknown): boolean {
  for (let current = error; typeof current === 'object' && current !== null; current = causeOf(current)) {
    if ('code' in current && current.code === LOCK_NOT_AVAILABLE) {
      return true;
    }
  }

  return false;
}

function causeOf(error: object): unknown {
  return 'cause' in error ? error.cause : undefined;
}
