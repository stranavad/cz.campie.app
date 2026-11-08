import { describe, expect, it } from 'vitest';

import type { CustomField, FormDefinition } from '../definition/form-definition.ts';
import { TEST_CATALOGUE } from '../testing-catalogue.ts';
import { columnCatalogue, diffVersions, missingNewAnswers } from './versions.ts';

const field = (id: string, label: string): CustomField => ({
  id,
  type: 'short_text',
  label,
  hint: null,
  required: false,
  scope: 'participant',
  health: false,
});

const A = '0190a2b4-0000-7000-8000-00000000000a';
const B = '0190a2b4-0000-7000-8000-00000000000b';
const C = '0190a2b4-0000-7000-8000-00000000000c';

const V1: FormDefinition = {
  standard: [{ key: 'insurer', state: 'optional' }],
  custom: [field(A, 'Alergie'), field(B, 'Plavec')],
};
const V2: FormDefinition = {
  standard: [
    { key: 'insurer', state: 'off' },
    { key: 'boardingPlace', state: 'required' },
  ],
  custom: [field(A, 'Alergie a léky'), field(C, 'Velikost trička')],
};

describe('diffVersions', () => {
  it('reports fields a later version asks and no longer asks, a standard field switched off as removed', () => {
    expect(diffVersions(V1, V2)).toEqual({ added: ['boardingPlace', C], removed: ['insurer', B], changed: [] });
  });

  it('reports nothing between a version and itself', () => {
    expect(diffVersions(V2, V2)).toEqual({ added: [], removed: [], changed: [] });
  });

  it('reports a field kept under its id but with another type or scope', () => {
    const retyped: FormDefinition = {
      ...V1,
      custom: [
        { ...field(A, 'Alergie'), type: 'number' },
        { ...field(B, 'Plavec'), scope: 'registration' },
      ],
    };

    expect(diffVersions(V1, retyped).changed).toEqual([A, B]);
  });

  it('reports a field that became health data under its id, since its answers are stored otherwise', () => {
    const marked: FormDefinition = { ...V1, custom: [{ ...field(A, 'Alergie'), health: true }, field(B, 'Plavec')] };

    expect(diffVersions(V1, marked).changed).toEqual([A]);
  });
});

describe('columnCatalogue', () => {
  it('lists the core, then every field any version asked, the latest labels first and removed ones marked', () => {
    const columns = columnCatalogue([V1, V2], TEST_CATALOGUE);

    expect(columns.slice(0, 11).map(({ key, tier }) => [key, tier])).toEqual([
      ['firstName', 'core'],
      ['lastName', 'core'],
      ['birthDate', 'core'],
      ['guardianFirstName', 'core'],
      ['guardianLastName', 'core'],
      ['guardianEmail', 'core'],
      ['guardianPhone', 'core'],
      ['secondGuardianFirstName', 'core'],
      ['secondGuardianLastName', 'core'],
      ['secondGuardianEmail', 'core'],
      ['secondGuardianPhone', 'core'],
    ]);
    expect(columns.slice(11)).toEqual([
      {
        key: 'boardingPlace',
        tier: 'standard',
        scope: 'registration',
        label: null,
        labelKey: 'form.standard.boardingPlace',
        removed: false,
        sensitivity: 'plain',
      },
      {
        key: A,
        tier: 'custom',
        scope: 'participant',
        label: 'Alergie a léky',
        labelKey: null,
        removed: false,
        sensitivity: 'plain',
      },
      {
        key: C,
        tier: 'custom',
        scope: 'participant',
        label: 'Velikost trička',
        labelKey: null,
        removed: false,
        sensitivity: 'plain',
      },
      {
        key: 'insurer',
        tier: 'standard',
        scope: 'participant',
        label: null,
        labelKey: 'form.standard.insurer',
        removed: true,
        sensitivity: 'plain',
      },
      {
        key: B,
        tier: 'custom',
        scope: 'participant',
        label: 'Plavec',
        labelKey: null,
        removed: true,
        sensitivity: 'plain',
      },
    ]);
  });
});

describe('missingNewAnswers', () => {
  const ADDED = '0190a2b4-0000-7000-8000-0000000000aa';
  const earlier: FormDefinition = { standard: [], custom: [] };
  const later: FormDefinition = {
    standard: [],
    custom: [
      {
        id: ADDED,
        type: 'short_text',
        label: 'Číslo pojištěnce',
        hint: null,
        required: true,
        scope: 'participant',
        health: false,
      },
    ],
  };

  it('counts a required field added later and unanswered, and none once answered or optional', () => {
    expect(missingNewAnswers(earlier, later, {}, { registration: {}, participant: {} })).toBe(1);
    expect(missingNewAnswers(earlier, later, {}, { registration: {}, participant: { [ADDED]: '123' } })).toBe(0);
    expect(missingNewAnswers(later, later, {}, { registration: {}, participant: {} })).toBe(0);
    const optional: FormDefinition = { ...later, custom: later.custom.map((field) => ({ ...field, required: false })) };
    expect(missingNewAnswers(earlier, optional, {}, { registration: {}, participant: {} })).toBe(0);
  });
});
