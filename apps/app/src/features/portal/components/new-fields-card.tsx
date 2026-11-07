import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { REGISTRATION_FIELD_CATALOGUE } from '@repo/schema/camps';
import { formFields, type Answers, type AnswerValue, type FieldScope, type FormField } from '@repo/schema/form-engine';
import type { GuardianEdit } from '@repo/schema/portal';

import { Button } from '@/components/ui/button';
import { RegistrationField } from '@/core/registration-form';
import { useAnswerNewFieldsMutation } from '@/features/portal/api/portal.queries';
import { editFailureOf } from '@/features/portal/components/edit-failure';

// The questions added to the form since the Registration was sent. A frozen answer with a surcharge shows
// as text: only the camp changes it.
export function NewFieldsCard({ registrationId, edit }: { registrationId: string; edit: GuardianEdit }) {
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
  const failure = editFailureOf(save.error);

  if (fieldsOf('registration').length === 0 && fieldsOf('participant').length === 0) {
    return null;
  }

  return (
    <fieldset className="flex flex-col gap-4 rounded-lg border p-4" disabled={!edit.editable}>
      <legend className="px-1 font-medium">{t('edit.newFields')}</legend>
      {fieldsOf('registration').map((field) =>
        isLocked(null, field.key) ? (
          <p key={field.key} className="text-sm">
            {t('edit.locked', { answer: show(field, registration[field.key]) })}
          </p>
        ) : (
          <RegistrationField
            key={field.key}
            field={field}
            value={registration[field.key]}
            onChange={(value) => setRegistration({ ...registration, [field.key]: value })}
          />
        ),
      )}
      {participants.map((participant, index) => (
        <div key={participant.participantId} className="flex flex-col gap-3">
          <p className="text-sm font-medium">
            {t('participant', {
              first: edit.participants[index]?.firstName,
              last: edit.participants[index]?.lastName,
            })}
          </p>
          {fieldsOf('participant').map((field) =>
            isLocked(participant.participantId, field.key) ? (
              <p key={field.key} className="text-sm">
                {t('edit.locked', { answer: show(field, participant.answers[field.key]) })}
              </p>
            ) : (
              <RegistrationField
                key={field.key}
                field={field}
                value={participant.answers[field.key]}
                onChange={(value) =>
                  setParticipants(
                    participants.map((other, at) =>
                      at === index ? { ...other, answers: { ...other.answers, [field.key]: value } } : other,
                    ),
                  )
                }
              />
            ),
          )}
        </div>
      ))}
      {failure === null ? null : (
        <p role="alert" className="text-sm text-destructive">
          {t(`edit.failure.${failure}`)}
        </p>
      )}
      {save.isSuccess ? <output className="text-sm">{t('edit.saved')}</output> : null}
      {edit.editable ? (
        <Button
          type="button"
          className="self-start"
          disabled={save.isPending}
          onClick={() =>
            save.mutate({
              registration: changed(registration, edit.registrationAnswers, 'registration', null),
              participants: participants.map(({ participantId, answers }, index) => ({
                participantId,
                answers: changed(answers, edit.participants[index]?.answers ?? {}, 'participant', participantId),
              })),
            })
          }
        >
          {t('edit.save')}
        </Button>
      ) : null}
    </fieldset>
  );
}
