import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { RegistrationDetail } from '@repo/schema/registrations';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useEditGuardianMutation } from '@/features/participants/api/participants.queries';
import { EditorTile } from '@/features/participants/components/editing/editor-tile';

interface GuardianEditorProps {
  organisationId: string;
  registrationId: string;
  guardian: RegistrationDetail['guardians'][number];
}

// One guardian's name and contacts.
export function GuardianEditor({ organisationId, registrationId, guardian }: GuardianEditorProps) {
  const { t } = useTranslation('participants');
  const [firstName, setFirstName] = useState(guardian.firstName);
  const [lastName, setLastName] = useState(guardian.lastName);
  const [email, setEmail] = useState(guardian.email);
  const [phone, setPhone] = useState(guardian.phone ?? '');
  const edit = useEditGuardianMutation(organisationId, registrationId);
  const fields = [
    { label: t('edit.firstName'), value: firstName, set: setFirstName, type: 'text' },
    { label: t('edit.lastName'), value: lastName, set: setLastName, type: 'text' },
    { label: t('edit.email'), value: email, set: setEmail, type: 'email' },
    { label: t('edit.phone'), value: phone, set: setPhone, type: 'tel' },
  ];

  return (
    <EditorTile title={t('edit.guardian', { number: guardian.position })}>
      <div className="grid gap-3 sm:grid-cols-2">
        {fields.map((field) => (
          <label key={field.label} className="flex min-w-0 flex-col gap-1.5 text-sm font-semibold">
            {field.label}
            <Input type={field.type} value={field.value} onChange={(event) => field.set(event.target.value)} />
          </label>
        ))}
      </div>
      {edit.isError ? (
        <p role="alert" className="text-sm text-destructive">
          {t('edit.failed')}
        </p>
      ) : null}
      <Button
        type="button"
        size="sm"
        className="self-start"
        disabled={edit.isPending}
        onClick={() =>
          edit.mutate({
            position: guardian.position,
            body: { firstName, lastName, email, phone: phone === '' ? null : phone },
          })
        }
      >
        {t('edit.save')}
      </Button>
    </EditorTile>
  );
}
