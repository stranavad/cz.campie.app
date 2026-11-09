import { CORE_FIELDS } from '@repo/schema/form-engine';

/**
 * Tell on which step (1-based) an answer is asked, by the path its error carries: the guardians' core
 * fields first, the children second, the Registration's own questions third; the rest (the code, the
 * declarations) on the summary.
 * @param path the error's path, as the form engine and the server give it
 */
export function stepOfPath(path: readonly (string | number)[]): number {
  if (path[0] === 'participants') {
    return 2;
  }

  if (path[0] === 'registration') {
    return CORE_FIELDS.some(({ key }) => key === path[1]) ? 1 : 3;
  }

  return 4;
}

/**
 * Find the child a list of error paths names first, to show that child.
 * @param paths the errors' paths
 */
export function firstChildOf(paths: readonly (readonly (string | number)[])[]): number | null {
  const index = paths.find((path) => path[0] === 'participants' && typeof path[1] === 'number')?.[1];

  return typeof index === 'number' ? index : null;
}
