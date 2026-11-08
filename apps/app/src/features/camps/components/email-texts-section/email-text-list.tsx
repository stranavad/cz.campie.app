import { useTranslation } from 'react-i18next';

import type { CampEmailText, EmailType } from '@repo/schema/emails';

import { Card } from '@/components/ui/card';

interface EmailTextListProps {
  emails: readonly CampEmailText[];
  opened: EmailType | null;
  onOpen: (type: EmailType) => void;
}

// The Camp's emails, each with whether it is sent and in whose wording; one is opened at a time.
export function EmailTextList({ emails, opened, onOpen }: EmailTextListProps) {
  const { t } = useTranslation('camps');

  return (
    <Card className="gap-1 p-2 sm:p-2">
      <h2 className="text-heading px-3.5 pt-3 pb-2">{t('emails.title')}</h2>
      {emails.map((email) => (
        <button
          key={email.type}
          type="button"
          aria-pressed={opened === email.type}
          className="flex min-h-14 w-full cursor-pointer flex-col justify-center rounded-2xl px-3.5 py-2 text-left leading-tight font-medium transition-colors hover:bg-muted aria-pressed:bg-muted aria-pressed:font-bold"
          onClick={() => onOpen(email.type)}
        >
          <span>{t(`emails.types.${email.type}`)}</span>
          <span className="text-[13px] font-normal text-muted-foreground">
            {email.enabled ? (email.customised ? t('emails.own') : t('emails.default')) : t('emails.off')}
          </span>
        </button>
      ))}
    </Card>
  );
}
