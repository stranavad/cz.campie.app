import { ImageIcon } from 'lucide-react';
import { useId } from 'react';
import { useTranslation } from 'react-i18next';

import type { FileLink } from '@repo/schema/files';
import { LOGO_CONTENT_TYPES } from '@repo/schema/organisations';

import { FileButton } from '@/components/file-button';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { CardTitle } from '@/components/ui/card';
import { useLogoField, type LogoMutations } from '@/core/branding/components/logo-field/use-logo-field.hook';
import { cn } from '@/lib/utils';

interface LogoFieldProps extends LogoMutations {
  logo: FileLink | null;
  // What stands in for a missing logo.
  emptyText: string;
  disabled?: boolean;
  // A field's label among other fields, or the title of a card of its own.
  titleAs?: 'label' | 'card';
}

// A logo is uploaded as soon as it is chosen; the page shows it from a short-lived link, on a round plate
// of a fixed size, so nothing jumps while the image loads.
export function LogoField({ logo, emptyText, disabled = false, titleAs = 'label', ...mutations }: LogoFieldProps) {
  const { t } = useTranslation();
  const hintId = useId();
  const { upload, remove, failure, isBusy } = useLogoField(mutations);
  const isLocked = disabled || isBusy;

  return (
    <div className="flex flex-col gap-3">
      {titleAs === 'card' ? (
        <CardTitle>{t('logoField.title')}</CardTitle>
      ) : (
        <span className="text-sm font-semibold">{t('logoField.title')}</span>
      )}
      <div className="flex flex-wrap items-center gap-4">
        <div
          className={cn(
            'flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-full border',
            logo === null ? 'border-dashed border-input text-subtle-foreground' : 'border-border bg-logo-plate p-2',
          )}
        >
          {logo === null ? (
            <ImageIcon aria-hidden="true" className="size-6" />
          ) : (
            <img src={logo.url} alt={t('logoField.current')} className="size-full object-contain" />
          )}
        </div>
        <div className="flex min-w-0 flex-[1_1_10rem] flex-col leading-snug">
          <span className="font-semibold">{logo === null ? emptyText : t('logoField.current')}</span>
          {disabled ? null : (
            <span id={hintId} className="text-[13px] text-muted-foreground">
              {t('logoField.hint')}
            </span>
          )}
        </div>
        {disabled ? null : (
          <div className="flex flex-wrap items-center gap-2">
            <FileButton
              label={logo === null ? t('logoField.upload') : t('logoField.replace')}
              accept={LOGO_CONTENT_TYPES.join(',')}
              describedBy={hintId}
              disabled={isLocked}
              onFile={upload}
            />
            {logo === null ? null : (
              <Button type="button" variant="ghost" disabled={isLocked} onClick={remove}>
                {t('logoField.remove')}
              </Button>
            )}
          </div>
        )}
      </div>
      {failure === null ? null : (
        <Alert variant="danger" role="alert">
          {t(`logoField.failure.${failure}`)}
        </Alert>
      )}
    </div>
  );
}
