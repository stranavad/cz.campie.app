import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { GuardianEdit } from '@repo/schema/portal';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useUpdateGuardianContactMutation } from '@/features/portal/api/portal.queries';
import { editFailureOf } from '@/features/portal/components/edit/edit-failure';
import { GuardianEmail } from '@/features/portal/components/edit/guardian-email';
import { LabelledInput } from '@/features/portal/components/edit/labelled-input';
import { StatusMessage } from '@/features/portal/components/shared/status-message';

type Guardian = GuardianEdit['guardians'][number];

interface GuardianCardProps {
  registrationId: string;
  guardian: Guardian;
  editable: boolean;
}

// One guardian's contact: name and phone saved at once, a new email only after its confirmation.
export function GuardianCard({ registrationId, guardian, editable }: GuardianCardProps) {
  const { t } = useTranslation('portal');
  const [firstName, setFirstName] = useState(guardian.firstName);
  const [lastName, setLastName] = useState(guardian.lastName);
  const [phone, setPhone] = useState(guardian.phone ?? '');
  const update = useUpdateGuardianContactMutation(registrationId);
  const failure = editFailureOf(update.error);

  return (
    <Card>
      <fieldset className="flex min-w-0 flex-col gap-4" disabled={!editable}>
        <legend className="mb-4 flex flex-col">
          <span className="text-[13px] font-bold text-muted-foreground">
            {t('edit.guardian', { number: guardian.position })}
          </span>
          <span className="text-heading">
            {t('participant', { first: guardian.firstName, last: guardian.lastName })}
          </span>
        </legend>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <LabelledInput
            label={t('edit.firstName')}
            value={firstName}
            autoComplete="given-name"
            onChange={(event) => setFirstName(event.target.value)}
          />
          <LabelledInput
            label={t('edit.lastName')}
            value={lastName}
            autoComplete="family-name"
            onChange={(event) => setLastName(event.target.value)}
          />
        </div>
        <LabelledInput
          label={t('edit.phone')}
          type="tel"
          value={phone}
          autoComplete="tel"
          onChange={(event) => setPhone(event.target.value)}
        />
        {failure === null ? null : <StatusMessage tone="danger">{t(`edit.failure.${failure}`)}</StatusMessage>}
        {update.isSuccess ? <StatusMessage tone="success">{t('edit.saved')}</StatusMessage> : null}
        {editable ? (
          <Button
            type="button"
            variant="brand"
            size="lg"
            className="w-full sm:w-auto sm:self-start"
            disabled={update.isPending}
            onClick={() =>
              update.mutate({
                position: guardian.position,
                body: { firstName, lastName, phone: phone === '' ? null : phone },
              })
            }
          >
            {t('edit.save')}
          </Button>
        ) : null}
        <GuardianEmail registrationId={registrationId} guardian={guardian} editable={editable} />
      </fieldset>
    </Card>
  );
}
