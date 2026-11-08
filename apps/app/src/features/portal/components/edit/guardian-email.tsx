import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { GuardianEdit } from '@repo/schema/portal';

import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useRequestEmailChangeMutation } from '@/features/portal/api/portal.queries';
import { editFailureOf } from '@/features/portal/components/edit/edit-failure';
import { LabelledInput } from '@/features/portal/components/edit/labelled-input';
import { StatusMessage } from '@/features/portal/components/shared/status-message';

interface GuardianEmailProps {
  registrationId: string;
  guardian: GuardianEdit['guardians'][number];
  editable: boolean;
}

// A guardian's email, the new one waiting for confirmation, and asking to change it.
export function GuardianEmail({ registrationId, guardian, editable }: GuardianEmailProps) {
  const { t } = useTranslation('portal');
  const [email, setEmail] = useState('');
  const changeEmail = useRequestEmailChangeMutation(registrationId);
  const failure = editFailureOf(changeEmail.error);

  return (
    <div className="flex flex-col gap-4 border-t border-border-subtle pt-4">
      <p className="text-sm wrap-anywhere">{t('edit.email', { email: guardian.email })}</p>
      {guardian.pendingEmail === null ? null : (
        <Alert variant="warning" className="wrap-anywhere">
          {t('edit.pendingEmail', { email: guardian.pendingEmail })}
        </Alert>
      )}
      {editable ? (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <div className="min-w-0 flex-1">
            <LabelledInput
              label={t('edit.newEmail')}
              type="email"
              value={email}
              autoComplete="email"
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>
          <Button
            type="button"
            variant="outline"
            className="h-12 sm:h-11"
            disabled={changeEmail.isPending || email.trim() === ''}
            onClick={() => changeEmail.mutate({ position: guardian.position, email })}
          >
            {t('edit.changeEmail')}
          </Button>
        </div>
      ) : null}
      {changeEmail.isSuccess ? <StatusMessage tone="success">{t('edit.emailSent')}</StatusMessage> : null}
      {failure === null ? null : <StatusMessage tone="danger">{t(`edit.failure.${failure}`)}</StatusMessage>}
    </div>
  );
}
