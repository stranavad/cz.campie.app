import { describe, expect, it } from 'vitest';

import { REGISTRATION_FIELD_CATALOGUE } from '@repo/schema/camps';
import { formFields, type FormDefinition } from '@repo/schema/form-engine';

import { STANDARD_FIELD_TEXTS, standardAnswerText } from './standard-field-texts.ts';

const WITH_PLACE: FormDefinition = {
  standard: [{ key: 'transport', state: 'optional', options: [{ id: 'misto-1', label: 'Brno, hlavní nádraží' }] }],
  custom: [],
};

describe('standard field texts', () => {
  it('names every platform option of the catalogue in Czech', () => {
    for (const [key, spec] of Object.entries(REGISTRATION_FIELD_CATALOGUE)) {
      const texts: Readonly<Record<string, string>> =
        STANDARD_FIELD_TEXTS[key as keyof typeof STANDARD_FIELD_TEXTS].options ?? {};

      expect(
        'options' in spec ? spec.options.map(({ value }) => value).filter((value) => !(value in texts)) : [],
      ).toEqual([]);
    }
  });

  it("names a platform option by its Czech text and a camp's own option by its label", () => {
    const [transport] = formFields(WITH_PLACE, REGISTRATION_FIELD_CATALOGUE, 'registration').filter(
      ({ key }) => key === 'transport',
    );

    expect(transport === undefined ? null : standardAnswerText(transport, 'misto-1')).toBe('Brno, hlavní nádraží');
    expect(transport === undefined ? null : standardAnswerText(transport, 'own')).toBe('Vlastní doprava');
  });
});
