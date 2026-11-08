import { describe, expect, it } from 'vitest';

import {
  checkAnswersTo,
  CORE_FIELDS,
  formDefinitionSchema,
  formFields,
  sensitiveKeys,
  type FormDefinition,
} from '@repo/schema/form-engine';

import { REGISTRATION_FIELD_CATALOGUE } from './registration-field-catalogue.ts';

const EVERYTHING: FormDefinition = {
  standard: Object.keys(REGISTRATION_FIELD_CATALOGUE).map((key) => ({ key, state: 'optional' as const })),
  custom: [],
};
const fields = formFields(EVERYTHING, REGISTRATION_FIELD_CATALOGUE, 'participant');
const registrationFields = formFields(EVERYTHING, REGISTRATION_FIELD_CATALOGUE, 'registration');
const checkParticipant = (answers: Record<string, string>) => checkAnswersTo(fields, answers, ['answers']);

describe('REGISTRATION_FIELD_CATALOGUE', () => {
  it('names no core field and makes a definition that switches every field on', () => {
    const core = new Set<string>(CORE_FIELDS.map(({ key }) => key));

    expect(Object.keys(REGISTRATION_FIELD_CATALOGUE).filter((key) => core.has(key))).toEqual([]);
    expect(formDefinitionSchema(REGISTRATION_FIELD_CATALOGUE).safeParse(EVERYTHING).success).toBe(true);
  });

  it('encrypts the rodné číslo and treats the health note as health data, nothing else', () => {
    expect([...sensitiveKeys([EVERYTHING], REGISTRATION_FIELD_CATALOGUE)]).toEqual([
      ['birthNumber', 'encrypted'],
      ['healthNote', 'health'],
    ]);
  });

  it('takes a rodné číslo with a valid checksum, written with its slash', () => {
    expect(checkParticipant({ birthNumber: '1605040019' })).toEqual({
      errors: [],
      value: { birthNumber: '160504/0019' },
    });
    expect(checkParticipant({ birthNumber: '160504/0018' }).errors).toEqual([
      { path: ['answers', 'birthNumber'], code: 'form_answer_invalid' },
    ]);
  });

  it('refuses a rodné číslo of another birth date than the one given, sent or kept', () => {
    expect(checkParticipant({ birthNumber: '160504/0019', birthDate: '2016-05-04' }).errors).toEqual([]);
    expect(checkParticipant({ birthNumber: '160504/0019', birthDate: '2016-05-05' }).errors).toEqual([
      { path: ['answers', 'birthNumber'], code: 'form_birth_number_mismatch' },
    ]);
    expect(
      checkAnswersTo(fields, { birthNumber: '160504/0019' }, ['answers'], { birthDate: '2015-05-04' }).errors,
    ).toEqual([{ path: ['answers', 'birthNumber'], code: 'form_birth_number_mismatch' }]);
  });

  it('takes the insurers by their codes only', () => {
    expect(checkParticipant({ insurer: '207' }).errors).toEqual([]);
    expect(checkParticipant({ insurer: '999' }).errors).toEqual([
      { path: ['answers', 'insurer'], code: 'form_answer_invalid' },
    ]);
  });

  it("offers own transport and the camp's boarding places", () => {
    const withPlaces: FormDefinition = {
      standard: [{ key: 'transport', state: 'required', options: [{ id: 'misto-1', label: 'Praha, Florenc' }] }],
      custom: [],
    };
    const transport = formFields(withPlaces, REGISTRATION_FIELD_CATALOGUE, 'registration');

    expect(checkAnswersTo(transport, { transport: 'misto-1' }, []).errors).toEqual([]);
    expect(checkAnswersTo(transport, { transport: 'own' }, []).errors).toEqual([]);
    expect(checkAnswersTo(transport, { transport: 'misto-2' }, []).errors).toHaveLength(1);
    expect(registrationFields.map(({ key }) => key)).toContain('transport');
  });
});
