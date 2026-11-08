import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { RegistrationDetail } from '@repo/schema/registrations';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  useAddAccessEmailMutation,
  useRemoveAccessEmailMutation,
} from '@/features/participants/api/participants.queries';
import { UndeliverableBadge } from '@/features/participants/components/undeliverable-badge';

// Addresses beyond the guardians that may open the Registration in the portal.
export function AccessEmails({ organisationId, detail }: { organisationId: string; detail: RegistrationDetail }) {
  const { t } = useTranslation('participants');
  const [email, setEmail] = useState('');
  const addAccess = useAddAccessEmailMutation(organisationId, detail.id);
  const removeAccess = useRemoveAccessEmailMutation(organisationId, detail.id);

  return (
    <div className="flex flex-col gap-3 border-t border-border-subtle pt-4 text-sm">
      <p className="font-semibold">{t('controls.accessEmails')}</p>
      {detail.accessEmails.map((access) => (
        <div key={access.id} className="flex flex-wrap items-start gap-2">
          <span className="min-w-0 flex-1">
            <span className="block break-all">{access.email}</span>
            {access.undeliverable ? (
              <UndeliverableBadge
                organisationId={organisationId}
                registrationId={detail.id}
                email={access.email}
                canClear
              />
            ) : null}
          </span>
          <Button type="button" size="sm" variant="outline" onClick={() => removeAccess.mutate(access.id)}>
            {t('controls.remove')}
          </Button>
        </div>
      ))}
      <form
        className="flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();

          if (email.trim() !== '') {
            addAccess.mutate(email, { onSuccess: () => setEmail('') });
          }
        }}
      >
        <Input
          type="email"
          aria-label={t('controls.newAccessEmail')}
          placeholder={t('controls.newAccessEmail')}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <Button type="submit" variant="outline" disabled={email.trim() === '' || addAccess.isPending}>
          {t('controls.add')}
        </Button>
      </form>
      {addAccess.isError ? (
        <p role="alert" className="text-destructive">
          {t('controls.addFailed')}
        </p>
      ) : null}
    </div>
  );
}
