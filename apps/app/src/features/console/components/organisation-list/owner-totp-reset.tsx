import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useResetOwnerTotpMutation } from '@/features/console/api/console.queries';
import { HttpError } from '@/lib/api';

// Turning off the two-step login of an Owner who lost their phone and recovery codes, once the operator
// checked who they are outside the platform.
export function OwnerTotpReset({ organisationId }: { organisationId: string }) {
  const { t } = useTranslation('console');
  const reset = useResetOwnerTotpMutation(organisationId);
  const [email, setEmail] = useState('');
  const isUnknown = reset.error instanceof HttpError && reset.error.status === 404;

  return (
    <details className="text-sm">
      <summary className="cursor-pointer text-muted-foreground">{t('ownerTotpReset.title')}</summary>
      <form
        className="mt-2 flex max-w-md flex-col gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          reset.mutate(email.trim());
        }}
      >
        <p className="text-muted-foreground">{t('ownerTotpReset.intro')}</p>
        <div className="flex items-end gap-2">
          <Input
            type="email"
            aria-label={t('ownerTotpReset.email')}
            placeholder={t('ownerTotpReset.email')}
            value={email}
            onChange={(event) => {
              reset.reset();
              setEmail(event.target.value);
            }}
            disabled={reset.isPending}
          />
          <Button type="submit" variant="destructive" size="sm" disabled={reset.isPending || email.trim() === ''}>
            {t('ownerTotpReset.submit')}
          </Button>
        </div>
        {reset.isSuccess ? <output>{t('ownerTotpReset.done')}</output> : null}
        {reset.isError ? (
          <p role="alert" className="text-destructive">
            {t(isUnknown ? 'ownerTotpReset.unknown' : 'ownerTotpReset.failure')}
          </p>
        ) : null}
      </form>
    </details>
  );
}
