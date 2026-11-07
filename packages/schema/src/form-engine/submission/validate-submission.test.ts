import { describe, expect, it } from 'vitest';

import type { FormDefinition } from '../definition/form-definition.ts';
import { TEST_CATALOGUE } from '../testing-catalogue.ts';
import {
  checkAnswersTo,
  checkSubmission,
  formFields,
  submissionSchema,
  type Submission,
} from './validate-submission.ts';

const TSHIRT = '0190a2b4-0000-7000-8000-000000000001';
const TRANSPORT = '0190a2b4-0000-7000-8000-000000000002';
const NOTE = '0190a2b4-0000-7000-8000-000000000003';
const ALLERGIES = '0190a2b4-0000-7000-8000-000000000004';
const SWIMMER = '0190a2b4-0000-7000-8000-000000000005';
const HEIGHT = '0190a2b4-0000-7000-8000-000000000006';
const ARRIVAL = '0190a2b4-0000-7000-8000-000000000007';

const DEFINITION: FormDefinition = {
  standard: [
    { key: 'insurer', state: 'required' },
    { key: 'boardingPlace', state: 'off' },
  ],
  custom: [
    {
      id: TSHIRT,
      type: 'single_choice',
      label: 'Velikost trička',
      hint: null,
      required: true,
      scope: 'participant',
      options: [
        { id: 's', label: 'S', surcharge: null, needsVerification: false },
        { id: 'm', label: 'M', surcharge: null, needsVerification: false },
      ],
    },
    {
      id: TRANSPORT,
      type: 'multiple_choice',
      label: 'Doprava',
      hint: null,
      required: false,
      scope: 'registration',
      options: [
        { id: 'tam', label: 'Tam', surcharge: 200, needsVerification: false },
        { id: 'zpet', label: 'Zpět', surcharge: 200, needsVerification: false },
      ],
    },
    { id: NOTE, type: 'long_text', label: 'Poznámka', hint: null, required: false, scope: 'registration' },
    { id: ALLERGIES, type: 'short_text', label: 'Alergie', hint: null, required: false, scope: 'participant' },
    {
      id: SWIMMER,
      type: 'yes_no',
      label: 'Umí plavat',
      hint: null,
      required: true,
      scope: 'participant',
      surcharge: null,
      needsVerification: false,
    },
    { id: HEIGHT, type: 'number', label: 'Výška v cm', hint: null, required: false, scope: 'participant' },
    { id: ARRIVAL, type: 'date', label: 'Příjezd', hint: null, required: false, scope: 'registration' },
  ],
};

const CHILD = {
  firstName: 'Ema',
  lastName: 'Testovací',
  birthDate: '2016-05-04',
  insurer: '111',
  [TSHIRT]: 'm',
  [SWIMMER]: true,
};

const SUBMISSION: Submission = {
  registration: {
    guardianFirstName: 'Jana',
    guardianLastName: 'Testovací',
    guardianEmail: 'jana@example.com',
    guardianPhone: '+420 123 456 789',
  },
  participants: [CHILD],
};

const errors = (submission: Submission) => checkSubmission(DEFINITION, TEST_CATALOGUE, submission).errors;

describe('checkSubmission', () => {
  it('accepts a submission that answers every required field and nothing unknown', () => {
    expect(errors(SUBMISSION)).toEqual([]);
  });

  it('requires the locked core of the child and the guardian', () => {
    expect(
      errors({
        registration: { ...SUBMISSION.registration, guardianEmail: '' },
        participants: [{ ...CHILD, lastName: ' ' }],
      }),
    ).toEqual([
      { path: ['registration', 'guardianEmail'], code: 'form_answer_required' },
      { path: ['participants', 0, 'lastName'], code: 'form_answer_required' },
    ]);
  });

  it('checks the core values: email, phone and a real birth date', () => {
    expect(
      errors({
        registration: { ...SUBMISSION.registration, guardianEmail: 'jana', guardianPhone: '12' },
        participants: [{ ...CHILD, birthDate: '2016-02-30' }],
      }).map(({ code }) => code),
    ).toEqual(['form_answer_invalid', 'form_answer_invalid', 'form_answer_invalid']);
  });

  it('enforces a required standard field and checks it by the catalogue', () => {
    const { insurer: _, ...withoutInsurer } = CHILD;

    expect(errors({ ...SUBMISSION, participants: [withoutInsurer] })).toEqual([
      { path: ['participants', 0, 'insurer'], code: 'form_answer_required' },
    ]);
    expect(errors({ ...SUBMISSION, participants: [{ ...CHILD, insurer: '999' }] })).toEqual([
      { path: ['participants', 0, 'insurer'], code: 'form_answer_invalid' },
    ]);
  });

  it('accepts no answer to a standard field that is off, nor to any unknown key', () => {
    expect(
      errors({
        registration: { ...SUBMISSION.registration, boardingPlace: 'Praha', hacked: 'x' },
        participants: [{ ...CHILD, [crypto.randomUUID()]: 'y' }],
      }).map(({ code }) => code),
    ).toEqual(['form_answer_unknown', 'form_answer_unknown', 'form_answer_unknown']);
  });

  it('takes per-Registration answers only once and per-Participant answers only per child', () => {
    expect(
      errors({
        registration: { ...SUBMISSION.registration, [TSHIRT]: 'm' },
        participants: [{ ...CHILD, [NOTE]: 'Ahoj' }],
      }),
    ).toEqual([
      { path: ['registration', TSHIRT], code: 'form_answer_unknown' },
      { path: ['participants', 0, NOTE], code: 'form_answer_unknown' },
    ]);
  });

  it('requires a required custom field of every child', () => {
    const { [SWIMMER]: _, ...second } = CHILD;

    expect(errors({ ...SUBMISSION, participants: [CHILD, second] })).toEqual([
      { path: ['participants', 1, SWIMMER], code: 'form_answer_required' },
    ]);
  });

  it.each([
    [ALLERGIES, 'a'.repeat(201), 'form_answer_too_long', { max: 200 }],
    [ALLERGIES, 42, 'form_answer_invalid', undefined],
    [TSHIRT, 'xl', 'form_answer_invalid', undefined],
    [SWIMMER, 'ano', 'form_answer_invalid', undefined],
    [HEIGHT, '140', 'form_answer_invalid', undefined],
    [HEIGHT, Number.NaN, 'form_answer_invalid', undefined],
  ])('checks a per-child custom answer by its type: %s = %j', (id, value, code, params) => {
    expect(errors({ ...SUBMISSION, participants: [{ ...CHILD, [id]: value }] })).toEqual([
      { path: ['participants', 0, id], code, ...(params === undefined ? {} : { params }) },
    ]);
  });

  it.each([
    [NOTE, 'a'.repeat(5001), 'form_answer_too_long', { max: 5000 }],
    [TRANSPORT, ['tam', 'tam'], 'form_answer_invalid', undefined],
    [TRANSPORT, ['letadlo'], 'form_answer_invalid', undefined],
    [TRANSPORT, 'tam', 'form_answer_invalid', undefined],
    [ARRIVAL, '2027-13-01', 'form_answer_invalid', undefined],
  ])('checks a per-Registration custom answer by its type: %s = %j', (id, value, code, params) => {
    expect(errors({ ...SUBMISSION, registration: { ...SUBMISSION.registration, [id]: value } })).toEqual([
      { path: ['registration', id], code, ...(params === undefined ? {} : { params }) },
    ]);
  });

  it('takes an optional custom field left out, empty or null alike', () => {
    expect(
      errors({
        registration: { ...SUBMISSION.registration, [NOTE]: '', [TRANSPORT]: [] },
        participants: [{ ...CHILD, [ALLERGIES]: null }],
      }),
    ).toEqual([]);
  });

  it('leaves an optional standard field out without complaint, and checks it when answered', () => {
    const optional = { ...DEFINITION, standard: [{ key: 'insurer', state: 'optional' as const }] };
    const { insurer: _, ...withoutInsurer } = CHILD;

    expect(checkSubmission(optional, TEST_CATALOGUE, { ...SUBMISSION, participants: [withoutInsurer] }).errors).toEqual(
      [],
    );
    expect(
      checkSubmission(optional, TEST_CATALOGUE, { ...SUBMISSION, participants: [{ ...CHILD, insurer: '999' }] }).errors,
    ).toEqual([{ path: ['participants', 0, 'insurer'], code: 'form_answer_invalid' }]);
  });

  it('normalises what it accepts: text trimmed, the email lowercased, empty answers dropped', () => {
    const { value } = checkSubmission(DEFINITION, TEST_CATALOGUE, {
      registration: { ...SUBMISSION.registration, guardianEmail: ' Jana@Example.COM ', [NOTE]: '' },
      participants: [{ ...CHILD, [ALLERGIES]: '  pyl  ' }],
    });

    expect(value.registration).toMatchObject({ guardianEmail: 'jana@example.com' });
    expect(value.registration).not.toHaveProperty(NOTE);
    expect(value.participants[0]).toMatchObject({ [ALLERGIES]: 'pyl' });
  });

  it('takes a second guardian optionally, needing a name and an email once any of theirs is given', () => {
    expect(
      errors({ ...SUBMISSION, registration: { ...SUBMISSION.registration, secondGuardianPhone: '+420 777 888 999' } }),
    ).toEqual([
      { path: ['registration', 'secondGuardianFirstName'], code: 'form_answer_required' },
      { path: ['registration', 'secondGuardianLastName'], code: 'form_answer_required' },
      { path: ['registration', 'secondGuardianEmail'], code: 'form_answer_required' },
    ]);
    expect(
      errors({
        ...SUBMISSION,
        registration: {
          ...SUBMISSION.registration,
          secondGuardianFirstName: 'Petr',
          secondGuardianLastName: 'Testovací',
          secondGuardianEmail: 'petr@example.com',
        },
      }),
    ).toEqual([]);
  });

  it('requires at least one child', () => {
    expect(errors({ ...SUBMISSION, participants: [] })).toEqual([
      { path: ['participants'], code: 'form_participants_required' },
    ]);
  });
});

describe('submissionSchema', () => {
  it('reports the same errors as Zod issues, with the code as message and its params', () => {
    const result = submissionSchema(DEFINITION, TEST_CATALOGUE).safeParse({
      ...SUBMISSION,
      participants: [{ ...CHILD, [ALLERGIES]: 'a'.repeat(201) }],
    });

    expect(result.error?.issues).toEqual([
      expect.objectContaining({
        path: ['participants', 0, ALLERGIES],
        message: 'form_answer_too_long',
        params: { max: 200 },
      }),
    ]);
  });

  it('passes a valid submission through, trimmed text included', () => {
    const parsed = submissionSchema(DEFINITION, TEST_CATALOGUE).parse({
      ...SUBMISSION,
      participants: [{ ...CHILD, firstName: ' Ema ' }],
    });

    expect(parsed.participants[0]?.firstName).toBe('Ema');
  });

  it('refuses something that is no submission at all', () => {
    expect(submissionSchema(DEFINITION, TEST_CATALOGUE).safeParse({ registration: 'x' }).success).toBe(false);
  });

  it('refuses a submission past its bounds before checking a single answer', () => {
    const schema = submissionSchema(DEFINITION, TEST_CATALOGUE);
    const many = Object.fromEntries(Array.from({ length: 301 }, (_, index) => [`k${index}`, 'x']));

    expect(schema.safeParse({ ...SUBMISSION, participants: Array.from({ length: 21 }, () => CHILD) }).success).toBe(
      false,
    );
    expect(schema.safeParse({ ...SUBMISSION, registration: { ...SUBMISSION.registration, ...many } }).success).toBe(
      false,
    );
    expect(schema.safeParse({ ...SUBMISSION, participants: [{ ...CHILD, [NOTE]: 'a'.repeat(10_001) }] }).success).toBe(
      false,
    );
  });
});

describe('formFields', () => {
  it("lists a scope's fields in the fixed order, the core first and a standard field switched off left out", () => {
    expect(formFields(DEFINITION, TEST_CATALOGUE, 'participant').map(({ tier, key }) => [tier, key])).toEqual([
      ['core', 'firstName'],
      ['core', 'lastName'],
      ['core', 'birthDate'],
      ['standard', 'insurer'],
      ['custom', TSHIRT],
      ['custom', ALLERGIES],
      ['custom', SWIMMER],
      ['custom', HEIGHT],
    ]);
    expect(formFields(DEFINITION, TEST_CATALOGUE, 'registration').map(({ key }) => key)).not.toContain('boardingPlace');
  });
});

describe('checkAnswersTo', () => {
  const fields = formFields(
    {
      standard: [],
      custom: [
        {
          id: '0190a2b4-0000-7000-8000-0000000000a1',
          type: 'short_text',
          label: 'Tričko',
          hint: null,
          required: true,
          scope: 'participant',
        },
      ],
    },
    TEST_CATALOGUE,
    'participant',
  ).filter(({ tier }) => tier === 'custom');

  it('checks only the answers sent, requiring none, and clears an emptied one', () => {
    expect(checkAnswersTo(fields, { '0190a2b4-0000-7000-8000-0000000000a1': '  M  ' }, ['answers'])).toEqual({
      errors: [],
      value: { '0190a2b4-0000-7000-8000-0000000000a1': 'M' },
    });
    expect(checkAnswersTo(fields, {}, ['answers'])).toEqual({ errors: [], value: {} });
    expect(checkAnswersTo(fields, { '0190a2b4-0000-7000-8000-0000000000a1': '' }, ['answers']).value).toEqual({
      '0190a2b4-0000-7000-8000-0000000000a1': null,
    });
  });

  it('refuses an answer to a field not offered and an answer its field does not take', () => {
    expect(
      checkAnswersTo(fields, { firstName: 'Ema', '0190a2b4-0000-7000-8000-0000000000a1': 7 }, ['answers']).errors,
    ).toEqual([
      { path: ['answers', 'firstName'], code: 'form_answer_unknown' },
      { path: ['answers', '0190a2b4-0000-7000-8000-0000000000a1'], code: 'form_answer_invalid' },
    ]);
  });
});
