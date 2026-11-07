import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAddGuardianMutation } from '@/features/portal/api/portal.queries';
import { editFailureOf } from '@/features/portal/components/edit-failure';

// Adds a second guardian, who gets an email with a login link and sees the Registration at once.
export function AddGuardianCard({ registrationId }: { registrationId: string }) {
  const { t } = useTranslation('portal');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const add = useAddGuardianMutation(registrationId);

  return (
    <fieldset className="flex flex-col gap-3 rounded-lg border p-4">
      <legend className="px-1 font-medium">{t('edit.addGuardian')}</legend>
      <label className="flex flex-col gap-1 text-sm">
        {t('edit.firstName')}
        <Input value={firstName} onChange={(event) => setFirstName(event.target.value)} />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        {t('edit.lastName')}
        <Input value={lastName} onChange={(event) => setLastName(event.target.value)} />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        {t('edit.emailLabel')}
        <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        {t('edit.phone')}
        <Input type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} />
      </label>
      {editFailureOf(add.error) === null ? null : (
        <p role="alert" className="text-sm text-destructive">
          {t(`edit.failure.${editFailureOf(add.error) ?? 'unexpected'}`)}
        </p>
      )}
      <Button
        type="button"
        className="self-start"
        disabled={add.isPending}
        onClick={() => add.mutate({ firstName, lastName, email, phone: phone === '' ? null : phone })}
      >
        {t('edit.add')}
      </Button>
    </fieldset>
  );
}
