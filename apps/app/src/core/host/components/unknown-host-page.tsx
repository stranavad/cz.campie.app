import { useTranslation } from 'react-i18next';

export function UnknownHostPage() {
  const { t } = useTranslation();

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-2 p-6">
      <h1 className="text-2xl font-semibold">{t('unknownHost.title')}</h1>
      <p className="text-muted-foreground">{t('unknownHost.description')}</p>
    </main>
  );
}
