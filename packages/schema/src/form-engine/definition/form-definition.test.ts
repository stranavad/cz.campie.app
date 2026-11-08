import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { TEST_CATALOGUE } from '../testing-catalogue.ts';
import { formDefinitionSchema, formDefinitionShape, sensitiveKeys } from './form-definition.ts';

const ID = '0190a2b4-0000-7000-8000-000000000001';

const RETURNING = {
  id: ID,
  type: 'yes_no',
  label: 'Byl už u nás',
  hint: null,
  required: false,
  scope: 'participant',
  health: false,
  surcharge: -500,
  needsVerification: true,
};

const messages = (definition: object) =>
  formDefinitionSchema(TEST_CATALOGUE)
    .safeParse(definition)
    .error?.issues.map(({ path, message }) => [path.join('.'), message]) ?? [];

describe('formDefinitionSchema', () => {
  it('takes standard switches and custom fields that hold together', () => {
    expect(messages({ standard: [{ key: 'insurer', state: 'required' }], custom: [RETURNING] })).toEqual([]);
  });

  it('refuses a standard field the catalogue does not know, or one switched twice', () => {
    expect(
      messages({
        standard: [
          { key: 'shoeSize', state: 'optional' },
          { key: 'insurer', state: 'optional' },
          { key: 'insurer', state: 'off' },
        ],
        custom: [],
      }),
    ).toEqual([
      ['standard.0.key', 'form_field_unknown'],
      ['standard.2.key', 'form_field_duplicate'],
    ]);
  });

  it('refuses a custom field twice and an option twice', () => {
    const choice = {
      ...RETURNING,
      id: '0190a2b4-0000-7000-8000-000000000002',
      type: 'single_choice',
      options: [
        { id: 'a', label: 'A', surcharge: null, needsVerification: false },
        { id: 'a', label: 'B', surcharge: null, needsVerification: false },
      ],
    };

    expect(messages({ standard: [], custom: [RETURNING, { ...RETURNING }, choice] })).toEqual([
      ['custom.1.id', 'form_field_duplicate'],
      ['custom.2.options.1.id', 'form_option_duplicate'],
    ]);
  });

  it('refuses a catalogue key that is a core field, and a choice without options', () => {
    const catalogue = {
      ...TEST_CATALOGUE,
      firstName: {
        scope: 'participant' as const,
        labelKey: 'x',
        sensitivity: 'plain' as const,
        input: 'text' as const,
        schema: z.string(),
      },
    };
    const noOptions = { ...RETURNING, type: 'single_choice', options: [] };

    expect(
      formDefinitionSchema(catalogue).safeParse({ standard: [{ key: 'firstName', state: 'optional' }], custom: [] })
        .success,
    ).toBe(false);
    expect(messages({ standard: [], custom: [noOptions] })).toHaveLength(1);
  });

  it('marks only a discount as needing verification', () => {
    expect(messages({ standard: [], custom: [{ ...RETURNING, surcharge: 300 }] })).toEqual([
      ['custom.0.needsVerification', 'form_verification_without_discount'],
    ]);
  });

  it('refuses a surcharge on health data, which a price line would tell', () => {
    expect(messages({ standard: [], custom: [{ ...RETURNING, health: true }] })).toEqual([
      ['custom.0.health', 'form_health_surcharge'],
    ]);
    expect(
      messages({ standard: [], custom: [{ ...RETURNING, health: true, surcharge: null, needsVerification: false }] }),
    ).toEqual([]);
  });

  it('takes the camp own options only on a field that takes them, each value once', () => {
    const places = (ids: string[]) => ids.map((id) => ({ id, label: `Místo ${id}` }));

    expect(
      messages({
        standard: [{ key: 'boardingPlace', state: 'optional', options: places(['praha', 'brno']) }],
        custom: [],
      }),
    ).toEqual([]);
    expect(
      messages({
        standard: [
          { key: 'boardingPlace', state: 'optional', options: places(['praha', 'own', 'praha']) },
          { key: 'insurer', state: 'optional', options: places(['999']) },
        ],
        custom: [],
      }),
    ).toEqual([
      ['standard.0.options.1.id', 'form_option_duplicate'],
      ['standard.0.options.2.id', 'form_option_duplicate'],
      ['standard.1.options', 'form_field_unknown'],
    ]);
  });
});

describe('sensitiveKeys', () => {
  it('names the catalogue fields that are not plain and the custom fields any version marks as health data', () => {
    const catalogue = {
      ...TEST_CATALOGUE,
      birthNumber: {
        scope: 'participant' as const,
        labelKey: 'x',
        sensitivity: 'encrypted' as const,
        input: 'birth_number' as const,
        schema: z.string(),
      },
    };
    const health = { ...RETURNING, id: '0190a2b4-0000-7000-8000-000000000009', health: true, surcharge: null };

    expect([
      ...sensitiveKeys(
        [RETURNING, health].map((field) => formDefinitionShape.parse({ standard: [], custom: [field] })),
        catalogue,
      ),
    ]).toEqual([
      ['birthNumber', 'encrypted'],
      [health.id, 'health'],
    ]);
  });
});
