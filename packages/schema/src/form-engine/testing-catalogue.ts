import type { StandardFieldCatalogue } from './definition/form-definition.ts';

// A small catalogue for the engine's tests; the platform's own is REGISTRATION_FIELD_CATALOGUE.
export const TEST_CATALOGUE: StandardFieldCatalogue = {
  insurer: {
    scope: 'participant',
    labelKey: 'form.standard.insurer',
    sensitivity: 'plain',
    input: 'choice',
    options: ['111', '201', '205'].map((value) => ({ value, labelKey: `form.standard.insurers.${value}` })),
  },
  boardingPlace: {
    scope: 'registration',
    labelKey: 'form.standard.boardingPlace',
    sensitivity: 'plain',
    input: 'camp_choice',
    options: [{ value: 'own', labelKey: 'form.standard.own' }],
  },
};
