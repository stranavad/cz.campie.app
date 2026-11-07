import { useId } from 'react';
import { useTranslation } from 'react-i18next';

import type { FileLink } from '@repo/schema/files';
import { LOGO_CONTENT_TYPES } from '@repo/schema/organisations';

import { Button } from '@/components/ui/button';
import { useLogoField } from '@/features/organisation-settings/components/logo-field/use-logo-field.hook';

interface LogoFieldProps {
  organisationId: string;
  logo: FileLink | null;
}

// The logo is uploaded as soon as it is chosen; the page shows it from a short-lived link.
export function LogoField({ organisationId, logo }: LogoFieldProps) {
  const { t } = useTranslation('organisationSettings');
  const { upload, remove, failure, isBusy } = useLogoField(organisationId);
  const inputId = useId();

  return (
    <div className="flex max-w-xl flex-col gap-3">
      <span className="text-sm font-medium">{t('logo.title')}</span>
      {logo === null ? (
        <p className="text-sm text-muted-foreground">{t('logo.none')}</p>
      ) : (
        <img
          src={logo.url}
          alt={t('logo.current')}
          className="h-16 w-auto self-start rounded border border-border p-1"
        />
      )}
      <div className="flex flex-wrap gap-3">
        <label htmlFor={inputId} className="cursor-pointer text-sm font-medium underline">
          {logo === null ? t('logo.upload') : t('logo.replace')}
        </label>
        <input
          id={inputId}
          type="file"
          accept={LOGO_CONTENT_TYPES.join(',')}
          className="sr-only"
          disabled={isBusy}
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = '';

            if (file !== undefined) {
              upload(file);
            }
          }}
        />
        {logo === null ? null : (
          <Button type="button" variant="outline" size="sm" disabled={isBusy} onClick={remove}>
            {t('logo.remove')}
          </Button>
        )}
      </div>
      <p className="text-sm text-muted-foreground">{t('logo.hint')}</p>
      {failure === null ? null : (
        <p role="alert" className="text-sm text-destructive">
          {t(`logo.failure.${failure}`)}
        </p>
      )}
    </div>
  );
}
