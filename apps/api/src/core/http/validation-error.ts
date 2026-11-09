import { BadRequestException, type StandardSchemaValidationPipeOptions } from '@nestjs/common';

import type { FieldError } from '@repo/schema/shared';

// A custom check's message is an i18n key the app translates; a built-in one is Zod's own sentence.
const I18N_KEY = /^[a-z][a-z0-9_]*$/;

type Issues = Parameters<NonNullable<StandardSchemaValidationPipeOptions['exceptionFactory']>>[0];

/**
 * Refuse a request that failed its schema, with each custom check's code at its field, so a form shows it
 * where it belongs.
 * @param issues what the schema found
 */
export function validationError(issues: Issues): BadRequestException {
  const fields: FieldError[] = issues.flatMap(({ message, path = [] }) =>
    I18N_KEY.test(message)
      ? [
          {
            path: pathOf(path),
            code: message,
          },
        ]
      : [],
  );

  return new BadRequestException({
    message: issues
      .map(({ message, path = [] }) => (path.length === 0 ? message : `${pathOf(path).join('.')}: ${message}`))
      .join('; '),
    ...(fields.length === 0 ? {} : { fields }),
  });
}

/**
 * Write an issue's path as the request's keys and indexes.
 * @param path the issue's path
 */
function pathOf(path: NonNullable<Issues[number]['path']>): (string | number)[] {
  return path.map((segment) => {
    const key = typeof segment === 'object' ? segment.key : segment;

    return typeof key === 'number' ? key : String(key);
  });
}
