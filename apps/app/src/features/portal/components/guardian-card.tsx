import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { GuardianEdit } from '@repo/schema/portal';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useRequestEmailChangeMutation, useUpdateGuardianContactMutation } from '@/features/portal/api/portal.queries';
import { editFailureOf } from '@/features/portal/components/edit-failure';

type Guardian = GuardianEdit['guardians'][number];

// One guardian's contact: name and phone saved at once, a new email only after its confirmation.
export function GuardianCard({
  registrationId,
  guardian,
  editable,
}: {
  registrationId: string;
  guardian: Guardian;
  editable: boolean;
}) {
  const { t } = useTranslation('portal');
  const [firstName, setFirstName] = useState(guardian.firstName);
  const [lastName, setLastName] = useState(guardian.lastName);
  const [phone, setPhone] = useState(guardian.phone ?? '');
  const [email, setEmail] = useState('');
  const update = useUpdateGuardianContactMutation(registrationId);
  const changeEmail = useRequestEmailChangeMutation(registrationId);

  return (
    <fieldset className="flex flex-col gap-3 rounded-lg border p-4" disabled={!editable}>
      <legend className="px-1 font-medium">{t('edit.guardian', { number: guardian.position })}</legend>
      <label className="flex flex-col gap-1 text-sm">
        {t('edit.firstName')}
        <Input value={firstName} onChange={(event) => setFirstName(event.target.value)} />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        {t('edit.lastName')}
        <Input value={lastName} onChange={(event) => setLastName(event.target.value)} />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        {t('edit.phone')}
        <Input type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} />
      </label>
      {editFailureOf(update.error) === null ? null : (
        <p role="alert" className="text-sm text-destructive">
          {t(`edit.failure.${editFailureOf(update.error) ?? 'unexpected'}`)}
        </p>
      )}
      {update.isSuccess ? <output className="text-sm">{t('edit.saved')}</output> : null}
      {editable ? (
        <Button
          type="button"
          className="self-start"
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
      <p className="text-sm">{t('edit.email', { email: guardian.email })}</p>
      {guardian.pendingEmail === null ? null : (
        <p className="text-sm text-muted-foreground">{t('edit.pendingEmail', { email: guardian.pendingEmail })}</p>
      )}
      {editable ? (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <label className="flex flex-1 flex-col gap-1 text-sm">
            {t('edit.newEmail')}
            <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
          </label>
          <Button
            type="button"
            variant="outline"
            disabled={changeEmail.isPending || email.trim() === ''}
            onClick={() => changeEmail.mutate({ position: guardian.position, email })}
          >
            {t('edit.changeEmail')}
          </Button>
        </div>
      ) : null}
      {changeEmail.isSuccess ? <output className="text-sm">{t('edit.emailSent')}</output> : null}
      {editFailureOf(changeEmail.error) === null ? null : (
        <p role="alert" className="text-sm text-destructive">
          {t(`edit.failure.${editFailureOf(changeEmail.error) ?? 'unexpected'}`)}
        </p>
      )}
    </fieldset>
  );
}
