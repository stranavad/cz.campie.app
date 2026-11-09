import { PlusIcon } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Card, CardTitle } from '@/components/ui/card';
import { useAddGuardianMutation } from '@/features/portal/api/portal.queries';
import { editFailureOf } from '@/features/portal/components/edit/edit-failure';
import { LabelledInput } from '@/features/portal/components/edit/labelled-input';
import { StatusMessage } from '@/features/portal/components/shared/status-message';

interface AddGuardianCardProps {
  registrationId: string;
}

// Adds a second guardian, who gets an email with a login link and sees the Registration at once.
export function AddGuardianCard({ registrationId }: AddGuardianCardProps) {
  const { t } = useTranslation('portal');
  const [isOpen, setIsOpen] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const add = useAddGuardianMutation(registrationId);
  const failure = editFailureOf(add.error);

  if (!isOpen) {
    return (
      <Button type="button" variant="dashed" size="lg" className="w-full" onClick={() => setIsOpen(true)}>
        <PlusIcon aria-hidden="true" />
        {t('edit.addGuardian')}
      </Button>
    );
  }

  return (
    <Card>
      <fieldset className="flex min-w-0 flex-col gap-4">
        <legend className="mb-4">
          <CardTitle>{t('edit.addGuardian')}</CardTitle>
        </legend>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <LabelledInput
            label={t('edit.firstName')}
            value={firstName}
            onChange={(event) => setFirstName(event.target.value)}
          />
          <LabelledInput
            label={t('edit.lastName')}
            value={lastName}
            onChange={(event) => setLastName(event.target.value)}
          />
        </div>
        <LabelledInput
          label={t('edit.emailLabel')}
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <LabelledInput
          label={t('edit.phone')}
          type="tel"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
        />
        {failure === null ? null : <StatusMessage tone="danger">{t(`edit.failure.${failure}`)}</StatusMessage>}
        <Button
          type="button"
          variant="brand"
          size="lg"
          className="w-full sm:w-auto sm:self-start"
          disabled={add.isPending}
          onClick={() => add.mutate({ firstName, lastName, email, phone: phone === '' ? null : phone })}
        >
          {t('edit.add')}
        </Button>
      </fieldset>
    </Card>
  );
}
