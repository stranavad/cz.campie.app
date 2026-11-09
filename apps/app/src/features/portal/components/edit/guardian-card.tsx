import { useTranslation } from 'react-i18next';

import type { GuardianEdit } from '@repo/schema/portal';

import { Alert } from '@/components/ui/alert';
import { Card } from '@/components/ui/card';
import type { EditFailure } from '@/features/portal/components/edit/edit-failure';
import { LabelledInput } from '@/features/portal/components/edit/labelled-input';
import type { GuardianDraft } from '@/features/portal/components/edit/use-edit-form.hook';
import { StatusMessage } from '@/features/portal/components/shared/status-message';

interface GuardianCardProps {
  guardian: GuardianEdit['guardians'][number];
  draft: GuardianDraft;
  editable: boolean;
  contactFailure: EditFailure | null;
  emailFailure: EditFailure | null;
  onChange: (draft: GuardianDraft) => void;
}

// One guardian's contact under their name: name and phone saved as they are, a new email only once the
// guardian confirms it from the link sent to it.
export function GuardianCard({ guardian, draft, editable, contactFailure, emailFailure, onChange }: GuardianCardProps) {
  const { t } = useTranslation('portal');

  return (
    <Card className="gap-3.5 p-4.5">
      <fieldset className="flex min-w-0 flex-col gap-3.5" disabled={!editable}>
        <legend className="mb-3.5">
          <h2 className="text-heading break-words">
            {t('participant', { first: guardian.firstName, last: guardian.lastName })}
          </h2>
        </legend>
        <div className="grid grid-cols-2 gap-3">
          <LabelledInput
            label={t('edit.firstName')}
            value={draft.firstName}
            autoComplete="given-name"
            onChange={(event) => onChange({ ...draft, firstName: event.target.value })}
          />
          <LabelledInput
            label={t('edit.lastName')}
            value={draft.lastName}
            autoComplete="family-name"
            onChange={(event) => onChange({ ...draft, lastName: event.target.value })}
          />
        </div>
        <LabelledInput
          label={t('edit.emailLabel')}
          type="email"
          value={draft.email}
          autoComplete="email"
          onChange={(event) => onChange({ ...draft, email: event.target.value })}
        />
        {guardian.pendingEmail === null ? null : (
          <Alert variant="warning" className="wrap-anywhere">
            {t('edit.pendingEmail', { email: guardian.email })}
          </Alert>
        )}
        {emailFailure === null ? null : (
          <StatusMessage tone="danger">{t(`edit.failure.${emailFailure}`)}</StatusMessage>
        )}
        <LabelledInput
          label={t('edit.phone')}
          type="tel"
          value={draft.phone}
          autoComplete="tel"
          onChange={(event) => onChange({ ...draft, phone: event.target.value })}
        />
        {contactFailure === null ? null : (
          <StatusMessage tone="danger">{t(`edit.failure.${contactFailure}`)}</StatusMessage>
        )}
      </fieldset>
    </Card>
  );
}
