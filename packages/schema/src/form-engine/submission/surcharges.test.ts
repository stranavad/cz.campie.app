import { describe, expect, it } from 'vitest';

import type { CustomField, FormDefinition } from '../definition/form-definition.ts';
import { pricedFieldIds, surchargesOf, withOptionLabels } from './surcharges.ts';

const TRANSPORT = '0190a2b4-0000-7000-8000-000000000002';
const RETURNING = '0190a2b4-0000-7000-8000-000000000008';
const TSHIRT = '0190a2b4-0000-7000-8000-000000000001';

const DEFINITION: FormDefinition = {
  standard: [],
  custom: [
    {
      id: TRANSPORT,
      type: 'multiple_choice',
      label: 'Doprava',
      hint: null,
      required: false,
      scope: 'registration',
      options: [
        { id: 'tam', label: 'Tam', surcharge: 200, needsVerification: false },
        { id: 'zpet', label: 'Zpět', surcharge: 150, needsVerification: false },
        { id: 'sami', label: 'Přivezeme sami', surcharge: null, needsVerification: false },
      ],
    },
    {
      id: RETURNING,
      type: 'yes_no',
      label: 'Byl už na našem táboře',
      hint: null,
      required: false,
      scope: 'participant',
      surcharge: -500,
      needsVerification: true,
    },
    {
      id: TSHIRT,
      type: 'single_choice',
      label: 'Tričko',
      hint: null,
      required: false,
      scope: 'participant',
      options: [
        { id: 'ano', label: 'Ano', surcharge: 250, needsVerification: false },
        { id: 'ne', label: 'Ne', surcharge: 0, needsVerification: false },
      ],
    },
  ],
};

describe('surchargesOf', () => {
  it('gives each child its own surcharge lines, a per-Registration answer to every child', () => {
    expect(
      surchargesOf(DEFINITION, {
        registration: { [TRANSPORT]: ['tam', 'zpet'] },
        participants: [
          { [RETURNING]: true, [TSHIRT]: 'ano' },
          { [RETURNING]: false, [TSHIRT]: 'ne' },
        ],
      }),
    ).toEqual([
      {
        surcharges: [
          { fieldId: TRANSPORT, optionId: 'tam', label: 'Doprava: Tam', amount: 200, needsVerification: false },
          { fieldId: TRANSPORT, optionId: 'zpet', label: 'Doprava: Zpět', amount: 150, needsVerification: false },
          {
            fieldId: RETURNING,
            optionId: null,
            label: 'Byl už na našem táboře',
            amount: -500,
            needsVerification: true,
          },
          { fieldId: TSHIRT, optionId: 'ano', label: 'Tričko: Ano', amount: 250, needsVerification: false },
        ],
      },
      {
        surcharges: [
          { fieldId: TRANSPORT, optionId: 'tam', label: 'Doprava: Tam', amount: 200, needsVerification: false },
          { fieldId: TRANSPORT, optionId: 'zpet', label: 'Doprava: Zpět', amount: 150, needsVerification: false },
        ],
      },
    ]);
  });

  it('gives no line for an unanswered field or an option without a surcharge', () => {
    expect(surchargesOf(DEFINITION, { registration: { [TRANSPORT]: ['sami'] }, participants: [{}] })).toEqual([
      { surcharges: [] },
    ]);
  });
});

describe('pricedFieldIds', () => {
  it('lists the fields whose answers can change the price, and no others', () => {
    expect(pricedFieldIds(DEFINITION)).toEqual([TRANSPORT, RETURNING, TSHIRT]);
    expect(
      pricedFieldIds({
        standard: [],
        custom: [
          { id: TSHIRT, type: 'short_text', label: 'Alergie', hint: null, required: false, scope: 'participant' },
        ],
      }),
    ).toEqual([]);
  });
});

describe('withOptionLabels', () => {
  const choice: CustomField = {
    id: '0190a2b4-0000-7000-8000-0000000000d1',
    type: 'multiple_choice',
    label: 'Strava',
    hint: null,
    required: false,
    scope: 'participant',
    options: [
      { id: 'veg', label: 'Vegetariánská', surcharge: null, needsVerification: false },
      { id: 'gluten', label: 'Bezlepková', surcharge: null, needsVerification: false },
    ],
  };

  it('names chosen options by their labels and leaves other answers alone', () => {
    expect(withOptionLabels(choice, ['gluten', 'veg'])).toEqual(['Bezlepková', 'Vegetariánská']);
    expect(withOptionLabels({ ...choice, type: 'single_choice' }, 'veg')).toBe('Vegetariánská');
    expect(withOptionLabels({ ...choice, type: 'short_text' } as never, 'veg')).toBe('veg');
  });
});
