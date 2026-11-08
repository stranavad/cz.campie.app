import type { TurnusFormValues } from '@/features/camps/components/turnus-section/turnus-form.schema';

type TextName = Exclude<keyof TurnusFormValues, 'closedManually'>;

// The fields of each part of the form, with their input type (a text input's, or our date or date-time picker) and whether they take the full width.
export const TURNUS_FORM_GROUPS = [
  {
    legend: 'run',
    fields: [
      ['name', 'text', true],
      ['startDate', 'date', false],
      ['endDate', 'date', false],
      ['place', 'text', false],
      ['capacity', 'number', false],
      ['minAge', 'number', false],
      ['maxAge', 'number', false],
      ['websiteUrl', 'url', true],
    ],
  },
  {
    legend: 'window',
    fields: [
      ['opensAt', 'datetime', true],
      ['closesAt', 'datetime', true],
    ],
  },
  {
    legend: 'prices',
    fields: [
      ['basePrice', 'number', false],
      ['earlyBirdPrice', 'number', false],
      ['earlyBirdLastDay', 'date', true],
      ['deposit', 'number', false],
      ['depositDueDays', 'number', false],
      ['balanceDueDate', 'date', true],
    ],
  },
] as const satisfies readonly { legend: string; fields: readonly (readonly [TextName, string, boolean])[] }[];
