import { useTranslation } from 'react-i18next';

// Every legal text is a draft until the lawyer's version replaces it.
export function DraftNotice() {
  const { t } = useTranslation('legal');

  return (
    <aside className="flex flex-col gap-1 rounded-lg border border-amber-300 bg-amber-50 p-4 text-amber-950">
      <p className="font-semibold">{t('draftNotice.title')}</p>
      <p className="text-sm">{t('draftNotice.description')}</p>
    </aside>
  );
}
