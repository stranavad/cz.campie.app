import { useTranslation } from 'react-i18next';

import { LegalText } from '@/features/legal/components/legal-document/legal-text';

// Each provider that stores or processes data, what for, which data and where.
export function ProcessorList() {
  const { t } = useTranslation('legal');
  const rows = t('processors.rows', { returnObjects: true });

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold">{t('processors.title')}</h2>
      <ul className="flex flex-col gap-3">
        {rows.map((row) => (
          <li key={row.name} className="flex flex-col gap-2 rounded-lg border p-4">
            <h3 className="font-medium">
              <LegalText text={row.name} />
            </h3>
            <dl className="grid gap-x-4 gap-y-1 text-sm sm:grid-cols-[8rem_1fr]">
              <dt className="text-muted-foreground">{t('processors.purpose')}</dt>
              <dd>
                <LegalText text={row.purpose} />
              </dd>
              <dt className="text-muted-foreground">{t('processors.data')}</dt>
              <dd>
                <LegalText text={row.data} />
              </dd>
              <dt className="text-muted-foreground">{t('processors.location')}</dt>
              <dd>
                <LegalText text={row.location} />
              </dd>
            </dl>
          </li>
        ))}
      </ul>
    </section>
  );
}
