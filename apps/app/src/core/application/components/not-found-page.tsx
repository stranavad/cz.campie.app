import { useTranslation } from 'react-i18next';

export function NotFoundPage() {
  const { t } = useTranslation();

  return (
    <section className="mx-auto flex w-full max-w-md flex-col gap-2 py-16 text-center">
      <h1 className="text-title">{t('notFound.title')}</h1>
      <p className="text-muted-foreground">{t('notFound.description')}</p>
    </section>
  );
}
