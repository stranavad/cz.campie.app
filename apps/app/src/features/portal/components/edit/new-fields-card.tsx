import { useTranslation } from 'react-i18next';

import type { GuardianEdit } from '@repo/schema/portal';

import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { RegistrationField } from '@/core/registration-form';
import type { EditFailure } from '@/features/portal/components/edit/edit-failure';
import { LockedAnswer } from '@/features/portal/components/edit/locked-answer';
import type { useNewFields } from '@/features/portal/components/edit/use-new-fields.hook';
import { StatusMessage } from '@/features/portal/components/shared/status-message';

interface NewFieldsCardProps {
  edit: GuardianEdit;
  fields: ReturnType<typeof useNewFields>;
  failure: EditFailure | null;
}

// The questions added to the form since the Registration was sent, saved with the page. A frozen answer
// with a surcharge shows as text: only the camp changes it.
export function NewFieldsCard({ edit, fields, failure }: NewFieldsCardProps) {
  const { t } = useTranslation('portal');

  if (!fields.hasFields) {
    return null;
  }

  return (
    <Card className="p-4.5">
      <fieldset className="flex min-w-0 flex-col gap-5" disabled={!edit.editable}>
        <legend className="mb-4">
          <Badge variant="brand">{t('edit.newFields')}</Badge>
        </legend>
        {fields.registrationFields.map((field) =>
          fields.isLocked(null, field.key) ? (
            <LockedAnswer key={field.key} answer={fields.show(field, fields.registration[field.key])} />
          ) : (
            <RegistrationField
              key={field.key}
              field={field}
              value={fields.registration[field.key]}
              onChange={(value) => fields.answerRegistration(field.key, value)}
            />
          ),
        )}
        {fields.participants.map((participant, index) => (
          <div key={participant.participantId} className="flex flex-col gap-4 border-t border-border-subtle pt-4">
            <p className="font-display text-lg font-bold">
              {t('participant', {
                first: edit.participants[index]?.firstName,
                last: edit.participants[index]?.lastName,
              })}
            </p>
            {fields.participantFields.map((field) =>
              fields.isLocked(participant.participantId, field.key) ? (
                <LockedAnswer key={field.key} answer={fields.show(field, participant.answers[field.key])} />
              ) : (
                <RegistrationField
                  key={field.key}
                  field={field}
                  value={participant.answers[field.key]}
                  onChange={(value) => fields.answerParticipant(index, field.key, value)}
                />
              ),
            )}
          </div>
        ))}
        {failure === null ? null : <StatusMessage tone="danger">{t(`edit.failure.${failure}`)}</StatusMessage>}
      </fieldset>
    </Card>
  );
}
