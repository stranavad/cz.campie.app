import { isGuardianFieldKey } from '@repo/schema/camps';

import {
  REGISTRATION_STEPS,
  type RegistrationStep,
} from '@/features/registration/components/registration-step.constant';

/**
 * Number a step as the address does, from 1.
 * @param name the step
 */
export function stepNumberOf(name: RegistrationStep): number {
  return REGISTRATION_STEPS.indexOf(name) + 1;
}

/**
 * Tell on which step (1-based) an answer is asked, by the path its error carries: the guardians' fields
 * first, the children second, the Registration's own questions third; the rest (the code, the
 * declarations) on the summary.
 * @param path the error's path, as the form engine and the server give it
 */
export function stepOfPath(path: readonly (string | number)[]): number {
  if (path[0] === 'participants') {
    return stepNumberOf('children');
  }

  if (path[0] === 'registration') {
    return stepNumberOf(typeof path[1] === 'string' && isGuardianFieldKey(path[1]) ? 'guardians' : 'questions');
  }

  return stepNumberOf('summary');
}

/**
 * Find the child a list of error paths names first, to show that child.
 * @param paths the errors' paths
 */
export function firstChildOf(paths: readonly (readonly (string | number)[])[]): number | null {
  const index = paths.find((path) => path[0] === 'participants' && typeof path[1] === 'number')?.[1];

  return typeof index === 'number' ? index : null;
}
