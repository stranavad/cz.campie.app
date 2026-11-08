import { useTranslation } from 'react-i18next';

interface EmailPreviewProps {
  subject: string;
  html: string;
}

// An email as guardians receive it, filled with made-up data.
export function EmailPreview({ subject, html }: EmailPreviewProps) {
  const { t } = useTranslation('camps');

  return (
    <div className="flex flex-col gap-2 border-t border-border-subtle pt-5">
      <p className="text-sm font-semibold break-words">{t('emails.previewSubject', { subject })}</p>
      {/* Sandboxed: the preview is HTML, rendered without scripts or a way out. */}
      <iframe
        title={t('emails.preview')}
        sandbox=""
        srcDoc={html}
        className="h-96 w-full rounded-2xl border border-border"
      />
    </div>
  );
}
