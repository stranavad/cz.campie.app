import { CircleAlertIcon } from 'lucide-react';
import { useId } from 'react';
import { useTranslation } from 'react-i18next';

import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select } from '@/components/ui/select';
import { useTurnusOptionLabel } from '@/core/selected-turnus';
import type { useCreateRegistrationPage } from '@/features/participants/components/create/use-create-registration-page.hook';

interface CreateSummaryProps {
  page: ReturnType<typeof useCreateRegistrationPage>;
}

// The side of the form: which Turnus, whether to email the guardians, and saving.
export function CreateSummary({ page }: CreateSummaryProps) {
  const { t } = useTranslation('participants');
  const optionLabel = useTurnusOptionLabel();
  const turnusId = useId();
  const noteId = useId();

  return (
    <aside className="flex min-w-0 flex-col gap-4 rounded-3xl border border-border bg-card p-5 sm:p-6 lg:sticky lg:top-6 lg:col-span-2">
      <h2 className="text-heading">{t('create.summary')}</h2>
      <div className="flex flex-col gap-1.5">
        <label htmlFor={turnusId} className="text-sm font-semibold">
          {t('turnus')}
        </label>
        <Select
          id={turnusId}
          value={page.chosen ?? null}
          onValueChange={page.setTurnusId}
          options={page.turnusy.map((turnus) => ({ value: turnus.id, label: optionLabel(turnus) }))}
        />
      </div>
      {page.hasNoForm ? (
        <Alert variant="warning">
          <CircleAlertIcon aria-hidden="true" />
          {t('create.noForm')}
        </Alert>
      ) : null}
      <label className="flex min-h-11 cursor-pointer items-start gap-3 text-sm">
        <Checkbox className="mt-0.5" checked={page.sendConfirmation} onCheckedChange={page.setSendConfirmation} />
        <span className="font-semibold">{t('create.sendConfirmation')}</span>
      </label>
      {page.failed ? (
        <Alert variant="danger" role="alert">
          <CircleAlertIcon aria-hidden="true" />
          {t('create.failed')}
        </Alert>
      ) : null}
      <Button type="button" size="lg" disabled={!page.canSubmit} onClick={page.submit} aria-describedby={noteId}>
        {t('create.submit')}
      </Button>
      <p id={noteId} className="text-[13px] text-muted-foreground">
        {t('create.submitNote')}
      </p>
    </aside>
  );
}
