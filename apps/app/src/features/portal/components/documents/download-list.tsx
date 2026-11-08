import { DownloadIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import type { GuardianDocuments } from '@repo/schema/documents';

import { IconTile } from '@/components/icon-tile';

// What the camp publishes for the Turnus to download.
export function DownloadList({ downloads }: { downloads: GuardianDocuments['downloads'] }) {
  const { t } = useTranslation('portal');

  if (downloads.length === 0) {
    return null;
  }

  return (
    <section className="flex flex-col gap-2.5 pt-3">
      <h2 className="px-1 text-[13px] font-bold text-muted-foreground">{t('documents.downloads')}</h2>
      <ul className="flex flex-col gap-2.5">
        {downloads.map((download) => (
          <li key={download.id}>
            <a
              href={download.file.url}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-3 rounded-3xl border border-border bg-card px-4 py-3.5 transition-colors hover:bg-muted"
            >
              <IconTile tone="brand">
                <DownloadIcon />
              </IconTile>
              <span className="flex min-w-0 flex-1 flex-col leading-snug">
                <span className="font-bold">{download.name}</span>
                {download.description === '' ? null : (
                  <span className="text-[13px] whitespace-pre-line text-muted-foreground">{download.description}</span>
                )}
              </span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
