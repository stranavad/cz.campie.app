import { useTranslation } from 'react-i18next';

import type { RegistrationDetail } from '@repo/schema/registrations';

import { Button } from '@/components/ui/button';
import { useRemoveAccessEmailMutation } from '@/features/participants/api/participants.queries';
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
        <Button
          type="button"
          variant="link"
          className="min-h-11 self-start text-sm sm:min-h-8"
          disabled={remove.isPending}
          onClick={() => remove.mutate(access.id)}
        >
          {t('controls.remove')}
        </Button>
      ) : null}
    </li>
  );
}
