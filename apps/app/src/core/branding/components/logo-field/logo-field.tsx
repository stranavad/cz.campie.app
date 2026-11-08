import { ImageIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import type { FileLink } from '@repo/schema/files';
import { LOGO_CONTENT_TYPES } from '@repo/schema/organisations';

import { FileButton } from '@/components/file-button';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useLogoField, type LogoMutations } from '@/core/branding/components/logo-field/use-logo-field.hook';
import { cn } from '@/lib/utils';

interface LogoFieldProps extends LogoMutations {
  logo: FileLink | null;
  // What stands in for a missing logo.
  emptyText: string;
  disabled?: boolean;
}

// A logo is uploaded as soon as it is chosen; the page shows it from a short-lived link. The preview box has
// a fixed size, so nothing jumps while the image loads.
export function LogoField({ logo, emptyText, disabled = false, ...mutations }: LogoFieldProps) {
  const { t } = useTranslation();
  const { upload, remove, failure, isBusy } = useLogoField(mutations);
  const isLocked = disabled || isBusy;

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-semibold">{t('logoField.title')}</span>
      <div className="flex flex-wrap items-center gap-4">
        <div
          className={cn(
            'flex h-20 w-36 shrink-0 items-center justify-center rounded-2xl border p-2',
            logo === null ? 'border-dashed border-input text-subtle-foreground' : 'border-border bg-logo-plate',
          )}
        >
          {logo === null ? (
            <ImageIcon aria-hidden="true" className="size-6" />
          ) : (
            <img src={logo.url} alt={t('logoField.current')} className="max-h-full max-w-full object-contain" />
          )}
        </div>
        <div className="flex min-w-0 flex-[1_1_12rem] flex-col gap-2">
          {logo === null ? <p className="text-sm text-muted-foreground">{emptyText}</p> : null}
          {disabled ? null : (
            <div className="flex flex-wrap items-center gap-2">
              <FileButton
                label={logo === null ? t('logoField.upload') : t('logoField.replace')}
                accept={LOGO_CONTENT_TYPES.join(',')}
                size="sm"
                disabled={isLocked}
                onFile={upload}
              />
              {logo === null ? null : (
                <Button type="button" variant="ghost" size="sm" disabled={isLocked} onClick={remove}>
                  {t('logoField.remove')}
                </Button>
              )}
            </div>
          )}
          {disabled ? null : <p className="text-[13px] text-muted-foreground">{t('logoField.hint')}</p>}
        </div>
      </div>
      {failure === null ? null : (
        <Alert variant="danger" role="alert">
          {t(`logoField.failure.${failure}`)}
        </Alert>
      )}
    </div>
  );
}
