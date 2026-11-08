import { EyeIcon, EyeOffIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import type { BuilderStatus } from '@/features/camps/components/registration-form-section/use-registration-form-builder.hook';
import { cn } from '@/lib/utils';

interface PublishBarProps {
  // The version guardians see; null before the first publish.
  latestVersion: number | null;
  status: BuilderStatus;
  canWrite: boolean;
  isSaving: boolean;
  isPreviewing: boolean;
  onSave: () => void;
  onPublish: () => void;
  onTogglePreview: () => void;
}

// What guardians see now, and the actions over the whole draft: preview, save, publish.
export function PublishBar({ latestVersion, status, canWrite, isSaving, isPreviewing, ...actions }: PublishBarProps) {
  const { t } = useTranslation('camps');
  const isDone = status === 'saved' || status === 'published';

  return (
    <div className="flex flex-col gap-2">
      <div
        className={cn(
          'flex flex-wrap items-center gap-x-2.5 gap-y-2 rounded-[18px] px-4 py-3 text-sm',
          latestVersion === null ? 'bg-warning text-warning-foreground' : 'bg-muted text-foreground',
        )}
      >
        <span className="flex-[1_1_18rem]">
          {latestVersion === null
            ? t('registrationForm.unpublished')
            : t('registrationForm.latest', { version: latestVersion })}
        </span>
        <Button type="button" variant="ghost" size="sm" onClick={actions.onTogglePreview}>
          {isPreviewing ? <EyeOffIcon aria-hidden="true" /> : <EyeIcon aria-hidden="true" />}
          {isPreviewing ? t('registrationForm.hidePreview') : t('registrationForm.showPreview')}
        </Button>
        {canWrite ? (
          <>
            <Button type="button" variant="outline" size="sm" disabled={isSaving} onClick={actions.onSave}>
              {t('registrationForm.saveDraft')}
            </Button>
            <Button type="button" size="sm" disabled={isSaving} onClick={actions.onPublish}>
              {t('registrationForm.publish')}
            </Button>
          </>
        ) : null}
      </div>
      {status === null ? null : (
        <Alert variant={isDone ? 'success' : 'danger'} role={isDone ? 'status' : 'alert'}>
          {t(`registrationForm.status.${status}`)}
        </Alert>
      )}
    </div>
  );
}
