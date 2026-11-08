import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { REGISTRATION_FIELD_CATALOGUE } from '@repo/schema/camps';
import { formFields, type Answers, type AnswerValue, type FieldScope, type FormField } from '@repo/schema/form-engine';
import type { GuardianEdit } from '@repo/schema/portal';

import { useAnswerNewFieldsMutation } from '@/features/portal/api/portal.queries';
import { editFailureOf } from '@/features/portal/components/edit/edit-failure';

/**
 * The answers to the questions added since the Registration was sent, and saving only what changed.
 * @param registrationId the guardian's Registration
 * @param edit what the guardian may change on it
 */
export function useNewFields(registrationId: string, edit: GuardianEdit) {
  const { t } = useTranslation('portal');
  const [registration, setRegistration] = useState<Answers>(edit.registrationAnswers);
  const [participants, setParticipants] = useState(() =>
    edit.participants.map(({ id, answers }) => ({ participantId: id, answers })),
  );
  const save = useAnswerNewFieldsMutation(registrationId);
  const fieldsOf = (scope: FieldScope) =>
    formFields(edit.definition, REGISTRATION_FIELD_CATALOGUE, scope).filter(({ key }) =>
      edit.newFieldIds.includes(key),
    );
  const isLocked = (participantId: string | null, fieldId: string) =>
    edit.lockedAnswers.some((locked) => locked.participantId === participantId && locked.fieldId === fieldId);
  // Only what this page changed is sent, so it never clears what someone else answered meanwhile.
  const changed = (answers: Answers, initial: Answers, scope: FieldScope, participantId: string | null) =>
    Object.fromEntries(
      fieldsOf(scope)
        .filter(({ key }) => !isLocked(participantId, key))
        .filter(({ key }) => JSON.stringify(answers[key] ?? null) !== JSON.stringify(initial[key] ?? null))
        .map(({ key }) => [key, answers[key] ?? null]),
    );
  const show = (field: FormField, value: AnswerValue | undefined) => {
    if (typeof value === 'boolean') {
      return t(value ? 'edit.yes' : 'edit.no');
    }

    const options = field.tier === 'custom' && 'options' in field.field ? field.field.options : [];
    const labelOf = (id: string) => options.find((option) => option.id === id)?.label ?? id;

    return Array.isArray(value)
      ? value.map(labelOf).join(', ')
      : typeof value === 'string'
        ? labelOf(value)
        : String(value ?? '');
  };

  return {
    hasFields: fieldsOf('registration').length > 0 || fieldsOf('participant').length > 0,
    registrationFields: fieldsOf('registration'),
    participantFields: fieldsOf('participant'),
    registration,
    participants,
    isLocked,
    show,
    answerRegistration: (key: string, value: AnswerValue) => setRegistration({ ...registration, [key]: value }),
    answerParticipant: (index: number, key: string, value: AnswerValue) =>
      setParticipants(
        participants.map((other, at) =>
          at === index ? { ...other, answers: { ...other.answers, [key]: value } } : other,
        ),
      ),
    submit: () =>
      save.mutate({
        registration: changed(registration, edit.registrationAnswers, 'registration', null),
        participants: participants.map(({ participantId, answers }, index) => ({
          participantId,
          answers: changed(answers, edit.participants[index]?.answers ?? {}, 'participant', participantId),
        })),
      }),
    isSaving: save.isPending,
    isSaved: save.isSuccess,
    failure: editFailureOf(save.error),
  };
}
