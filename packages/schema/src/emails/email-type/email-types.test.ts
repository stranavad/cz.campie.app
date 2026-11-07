import { describe, expect, it } from 'vitest';

import { unknownPlaceholders } from '../placeholders/placeholders.ts';
import { EMAIL_TYPE_SPECS, EMAIL_TYPES } from './email-types.ts';

describe('EMAIL_TYPE_SPECS', () => {
  it.each(EMAIL_TYPES)("gives %s a default subject and text using only the type's placeholders", (type) => {
    const { subject, text, placeholders } = EMAIL_TYPE_SPECS[type];

    expect(subject.trim()).not.toBe('');
    expect(text.trim()).not.toBe('');
    expect(unknownPlaceholders(`${subject}\n${text}`, placeholders)).toEqual([]);
  });

  it('lets every type but the login link be switched off', () => {
    expect(EMAIL_TYPES.filter((type) => !EMAIL_TYPE_SPECS[type].canSwitchOff)).toEqual(['login_link']);
  });
});
