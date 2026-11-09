import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAddAccessEmailMutation } from '@/features/participants/api/participants.queries';

interface AccessEmailFormProps {
  organisationId: string;
  registrationId: string;
}

// Gives another address, such as a grandparent's, access to the Registration in the portal.
export function AccessEmailForm({ organisationId, registrationId }: AccessEmailFormProps) {
  const { t } = useTranslation('participants');
  const [email, setEmail] = useState('');
  const addAccess = useAddAccessEmailMutation(organisationId, registrationId);

  return (
    <form
      className="flex flex-col gap-2 border-t border-border-subtle pt-4 text-sm"
      onSubmit={(event) => {
        event.preventDefault();

        if (email.trim() !== '') {
          addAccess.mutate(email, { onSuccess: () => setEmail('') });
        }
      }}
    >
      <label htmlFor={`access-${registrationId}`} className="font-semibold">
        {t('controls.accessEmails')}
      </label>
      <div className="flex gap-2">
        <Input
          id={`access-${registrationId}`}
          type="email"
          placeholder={t('controls.newAccessEmail')}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <Button type="submit" variant="outline" disabled={email.trim() === '' || addAccess.isPending}>
          {t('controls.add')}
        </Button>
      </div>
      {addAccess.isError ? (
        <p role="alert" className="text-destructive">
          {t('controls.addFailed')}
        </p>
      ) : null}
    </form>
  );
}
