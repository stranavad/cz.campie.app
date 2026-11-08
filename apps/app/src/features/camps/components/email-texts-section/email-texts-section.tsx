import { useTranslation } from 'react-i18next';

import { Card } from '@/components/ui/card';
import { EmailTextForm } from '@/features/camps/components/email-texts-section/email-text-form';
import { EmailTextList } from '@/features/camps/components/email-texts-section/email-text-list';
import { useEmailTextsSection } from '@/features/camps/components/email-texts-section/use-email-texts-section.hook';

interface EmailTextsSectionProps {
  organisationId: string;
  campId: string;
  canWrite: boolean;
}

// The Camp's emails: the list beside the one opened to edit.
export function EmailTextsSection({ organisationId, campId, canWrite }: EmailTextsSectionProps) {
  const { t } = useTranslation('camps');
  const { emails, opened, editorRef, open } = useEmailTextsSection(organisationId, campId);

  return (
    <div className="flex flex-col gap-4">
      <p className="max-w-3xl text-muted-foreground">{t('emails.intro')}</p>
      {emails.isPending ? <p className="text-muted-foreground">{t('loading')}</p> : null}
      {emails.isError ? <p className="text-destructive">{t('error')}</p> : null}
      {emails.data === undefined ? null : (
        <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
          <EmailTextList emails={emails.data} opened={opened?.type ?? null} onOpen={open} />
          {opened === undefined ? null : (
            <Card ref={editorRef} className="scroll-mt-4">
              <EmailTextForm
                key={opened.type}
                organisationId={organisationId}
                campId={campId}
                email={opened}
                canWrite={canWrite}
              />
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
