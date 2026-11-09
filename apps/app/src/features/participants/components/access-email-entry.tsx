import { useTranslation } from 'react-i18next';

import type { RegistrationDetail } from '@repo/schema/registrations';

import { useRemoveAccessEmailMutation } from '@/features/participants/api/participants.queries';
import { ConfirmRemoveDialog } from '@/features/participants/components/confirm-remove-dialog';
import { UndeliverableBadge } from '@/features/participants/components/undeliverable-badge';

interface AccessEmailEntryProps {
  organisationId: string;
  registrationId: string;
  access: RegistrationDetail['accessEmails'][number];
  canWrite: boolean;
}

// An address beyond the guardians that may open the Registration in the portal, beside the guardians.
export function AccessEmailEntry({ organisationId, registrationId, access, canWrite }: AccessEmailEntryProps) {
  const { t } = useTranslation('participants');
  const remove = useRemoveAccessEmailMutation(organisationId, registrationId);

  return (
    <li className="flex min-w-0 flex-col gap-0.5">
      <span className="font-semibold">{t('controls.accessEmail')}</span>
      <span className="break-all text-muted-foreground">{access.email}</span>
      {access.undeliverable ? (
        <UndeliverableBadge
          organisationId={organisationId}
          registrationId={registrationId}
          email={access.email}
          canClear={canWrite}
        />
      ) : null}
      {canWrite ? (
        <ConfirmRemoveDialog
          label={t('controls.remove')}
          title={t('controls.removeAccessEmailTitle')}
          description={t('controls.removeAccessEmailNote', { email: access.email })}
          isPending={remove.isPending}
          isError={remove.isError}
          onConfirm={() => remove.mutate(access.id)}
        />
      ) : null}
    </li>
  );
}
