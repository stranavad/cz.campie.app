import { useId } from 'react';
import { useTranslation } from 'react-i18next';

import type { FileLink } from '@repo/schema/files';
import { LOGO_CONTENT_TYPES } from '@repo/schema/organisations';

import { Button } from '@/components/ui/button';
import { useLogoField, type LogoMutations } from '@/core/branding/components/logo-field/use-logo-field.hook';

interface LogoFieldProps extends LogoMutations {
  logo: FileLink | null;
  // What stands in for a missing logo.
  emptyText: string;
  disabled?: boolean;
}

// A logo is uploaded as soon as it is chosen; the page shows it from a short-lived link.
export function LogoField({ logo, emptyText, disabled = false, ...mutations }: LogoFieldProps) {
  const { t } = useTranslation();
  const { upload, remove, failure, isBusy } = useLogoField(mutations);
  const inputId = useId();
  const isLocked = disabled || isBusy;

  return (
    <div className="flex max-w-xl flex-col gap-3">
      <span className="text-sm font-medium">{t('logoField.title')}</span>
      {logo === null ? (
        <p className="text-sm text-muted-foreground">{emptyText}</p>
      ) : (
        <img
          src={logo.url}
          alt={t('logoField.current')}
          className="h-16 w-auto self-start rounded border border-border p-1"
        />
      )}
      {disabled ? null : (
        <div className="flex flex-wrap items-center gap-3">
          <label htmlFor={inputId} className="cursor-pointer text-sm font-medium underline">
            {logo === null ? t('logoField.upload') : t('logoField.replace')}
          </label>
          <input
            id={inputId}
            type="file"
            accept={LOGO_CONTENT_TYPES.join(',')}
            className="sr-only"
            disabled={isLocked}
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = '';

              if (file !== undefined) {
                upload(file);
              }
            }}
          />
          {logo === null ? null : (
            <Button type="button" variant="outline" size="sm" disabled={isLocked} onClick={remove}>
              {t('logoField.remove')}
            </Button>
          )}
        </div>
      )}
      {disabled ? null : <p className="text-sm text-muted-foreground">{t('logoField.hint')}</p>}
      {failure === null ? null : (
        <p role="alert" className="text-sm text-destructive">
          {t(`logoField.failure.${failure}`)}
        </p>
      )}
    </div>
  );
}
