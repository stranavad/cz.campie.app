import type { TFunction } from 'i18next';

import type common from '@/locales/cs/common.json';

type ValidationKey = `validation.${keyof (typeof common)['validation']}`;

// Shared schemas name their own checks by an i18n key (`ico_invalid`); Zod's built-in checks come
// already translated by its Czech locale, and the API's codes are set as keys too.
export function fieldErrors(t: TFunction, i18nExists: (key: string) => boolean, errors: unknown[]) {
  return errors.map((error) => {
    const message = typeof error === 'string' ? error : messageOf(error);
    const key = `validation.${message}`;

    return { message: i18nExists(key) ? t(key as ValidationKey) : message };
  });
}

function messageOf(error: unknown): string {
  return typeof error === 'object' && error !== null && 'message' in error && typeof error.message === 'string'
    ? error.message
    : '';
}
