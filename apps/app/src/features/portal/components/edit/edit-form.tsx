import { useTranslation } from 'react-i18next';

import type { GuardianEdit } from '@repo/schema/portal';
import { czechDate } from '@repo/schema/shared';

import { StickyActionBar } from '@/components/sticky-action-bar';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AddGuardianCard } from '@/features/portal/components/edit/add-guardian-card';
import { GuardianCard } from '@/features/portal/components/edit/guardian-card';
import { NewFieldsCard } from '@/features/portal/components/edit/new-fields-card';
import { RemovedAnswers } from '@/features/portal/components/edit/removed-answers';
import { useEditForm } from '@/features/portal/components/edit/use-edit-form.hook';
import { StatusMessage } from '@/features/portal/components/shared/status-message';

interface EditFormProps {
  registrationId: string;
  edit: GuardianEdit;
}

// The guardians' contacts and the new questions, saved together from the bar at the bottom; a second
// guardian is added on their own.
export function EditForm({ registrationId, edit }: EditFormProps) {
  const { t } = useTranslation('portal');
  const form = useEditForm(registrationId, edit);

  return (
    <>
      {edit.editable ? (
        edit.lockDate === null ? null : (
          <p className="rounded-[18px] bg-muted px-3.5 py-3 text-sm text-muted-foreground">
            {t('edit.until', { date: czechDate(edit.lockDate) })}
          </p>
        )
      ) : (
        <Alert variant="warning">
          <output>{t('edit.readOnly')}</output>
        </Alert>
      )}
      {form.guardians.map(({ guardian, draft }) => (
        <GuardianCard
          key={guardian.position}
          guardian={guardian}
          draft={draft}
          editable={edit.editable}
          contactFailure={form.failureAt(`contact-${guardian.position}`)}
          emailFailure={form.failureAt(`email-${guardian.position}`)}
          onChange={(next) => form.change(guardian.position, next)}
        />
      ))}
      {edit.editable && edit.guardians.length < 2 ? <AddGuardianCard registrationId={registrationId} /> : null}
      <NewFieldsCard edit={edit} fields={form.fields} failure={form.failureAt('fields')} />
      <RemovedAnswers removed={edit.removed} />
      {edit.editable ? (
        <StickyActionBar className="mt-3 flex-col items-stretch gap-2">
          {form.hasFailed ? <StatusMessage tone="danger">{t('edit.partlyFailed')}</StatusMessage> : null}
          {form.isSaved ? <StatusMessage tone="success">{t('edit.saved')}</StatusMessage> : null}
          <Button
            type="button"
            variant="brand"
            size="lg"
            className="w-full"
            disabled={!form.hasChanges || form.isSaving}
            onClick={() => void form.save()}
          >
            {t('edit.save')}
          </Button>
        </StickyActionBar>
      ) : null}
    </>
  );
}
