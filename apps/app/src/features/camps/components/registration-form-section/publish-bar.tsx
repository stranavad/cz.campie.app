import { EyeIcon, EyeOffIcon } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { czechDate, pragueDateOf } from '@repo/schema/shared';

import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import type { BuilderStatus } from '@/features/camps/components/registration-form-section/use-registration-form-builder.hook';
import { cn } from '@/lib/utils';

interface PublishBarProps {
  // The version guardians see; null before the first publish.
  latest: { version: number; publishedAt: string } | null;
  // Whether anything differs from that version, saved or not.
  hasChanges: boolean;
  status: BuilderStatus;
  canWrite: boolean;
  isSaving: boolean;
  isPreviewing: boolean;
  onSave: () => void;
  onPublish: () => void;
  onDiscard: () => void;
  onTogglePreview: () => void;
}

const DONE: readonly BuilderStatus[] = ['saved', 'published', 'discarded'];

// Which version guardians see and, highlighted, that the draft differs from it; the actions over the whole
// draft: preview, throw it away for the published version (asked once more), save, publish as the next.
// Without changes there is nothing to throw away or publish.
export function PublishBar({
  latest,
  hasChanges,
  status,
  canWrite,
  isSaving,
  isPreviewing,
  ...actions
}: PublishBarProps) {
  const { t } = useTranslation('camps');
  const [isConfirmingDiscard, setConfirmingDiscard] = useState(false);
  const isDone = DONE.includes(status);
  const nextVersion = (latest?.version ?? 0) + 1;

  return (
    <div className="flex flex-col gap-2">
      <div
        className={cn(
          'flex flex-wrap items-center gap-x-2.5 gap-y-2 rounded-[18px] px-4 py-3 text-sm',
          hasChanges ? 'bg-warning text-warning-foreground' : 'bg-muted text-muted-foreground',
        )}
      >
        <span className="flex-[1_1_18rem]">
          {latest === null
            ? t('registrationForm.unpublished')
            : t(hasChanges ? 'registrationForm.latest' : 'registrationForm.upToDate', {
                version: latest.version,
                date: czechDate(pragueDateOf(new Date(latest.publishedAt))),
              })}
        </span>
        <Button type="button" variant="ghost" size="sm" onClick={actions.onTogglePreview}>
          {isPreviewing ? <EyeOffIcon aria-hidden="true" /> : <EyeIcon aria-hidden="true" />}
          {isPreviewing ? t('registrationForm.hidePreview') : t('registrationForm.showPreview')}
        </Button>
        {canWrite && latest !== null && hasChanges && !isConfirmingDiscard ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="underline underline-offset-2"
            disabled={isSaving}
            onClick={() => setConfirmingDiscard(true)}
          >
            {t('registrationForm.discard')}
          </Button>
        ) : null}
        {canWrite && isConfirmingDiscard ? (
          <>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={isSaving}
              onClick={() => {
                setConfirmingDiscard(false);
                actions.onDiscard();
              }}
            >
              {t('registrationForm.confirmDiscard')}
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setConfirmingDiscard(false)}>
              {t('registrationForm.keepDraft')}
            </Button>
          </>
        ) : null}
        {canWrite ? (
          <>
            <Button type="button" variant="outline" size="sm" disabled={isSaving} onClick={actions.onSave}>
              {t('registrationForm.saveDraft')}
            </Button>
            <Button type="button" size="sm" disabled={isSaving || !hasChanges} onClick={actions.onPublish}>
              {t('registrationForm.publish', { version: nextVersion })}
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
