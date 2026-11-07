import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { EmailType } from '@repo/schema/emails';

import { EmailTextForm } from '@/features/camps/components/email-texts-section/email-text-form';
import { useEmailTextsSection } from '@/features/camps/components/email-texts-section/use-email-texts-section.hook';

interface EmailTextsSectionProps {
  organisationId: string;
  campId: string;
  canWrite: boolean;
}

// The Camp's emails, one opened at a time to edit.
export function EmailTextsSection({ organisationId, campId, canWrite }: EmailTextsSectionProps) {
  const { t } = useTranslation('camps');
  const emails = useEmailTextsSection(organisationId, campId);
  const [opened, setOpened] = useState<EmailType | null>(null);

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold">{t('emails.title')}</h2>
      {emails.isPending ? <p className="text-muted-foreground">{t('loading')}</p> : null}
      {emails.isError ? <p className="text-destructive">{t('error')}</p> : null}
      <ul className="flex flex-col">
        {(emails.data ?? []).map((email) => (
          <li key={email.type} className="flex flex-col gap-3 border-b border-border py-3">
            <button
              type="button"
              className="flex flex-wrap items-baseline gap-3 text-left"
              aria-expanded={opened === email.type}
              onClick={() => setOpened(opened === email.type ? null : email.type)}
            >
              <span className="font-medium">{t(`emails.types.${email.type}`)}</span>
              <span className="text-sm text-muted-foreground">
                {email.enabled ? (email.customised ? t('emails.own') : t('emails.default')) : t('emails.off')}
              </span>
            </button>
            {opened === email.type ? (
              <EmailTextForm organisationId={organisationId} campId={campId} email={email} canWrite={canWrite} />
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
