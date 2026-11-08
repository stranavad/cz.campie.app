import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Alert } from '@/components/ui/alert';
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
      <summary className="flex min-h-11 cursor-pointer items-center font-semibold text-muted-foreground transition-colors hover:text-foreground">
        {t('ownerTotpReset.title')}
      </summary>
      <form
        className="mt-1 flex max-w-lg flex-col gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          reset.mutate(email.trim());
        }}
      >
        <p className="text-muted-foreground">{t('ownerTotpReset.intro')}</p>
        <div className="flex flex-wrap gap-2">
          <Input
            type="email"
            className="flex-[1_1_12rem]"
            aria-label={t('ownerTotpReset.email')}
            placeholder={t('ownerTotpReset.email')}
            value={email}
            onChange={(event) => {
              reset.reset();
              setEmail(event.target.value);
            }}
            disabled={reset.isPending}
          />
          <Button type="submit" variant="destructive" disabled={reset.isPending || email.trim() === ''}>
            {t('ownerTotpReset.submit')}
          </Button>
        </div>
        {reset.isSuccess ? (
          <Alert variant="success">
            <output>{t('ownerTotpReset.done')}</output>
          </Alert>
        ) : null}
        {reset.isError ? (
          <Alert variant="danger" role="alert">
            {t(isUnknown ? 'ownerTotpReset.unknown' : 'ownerTotpReset.failure')}
          </Alert>
        ) : null}
      </form>
    </details>
  );
}
