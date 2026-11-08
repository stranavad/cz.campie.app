import { ChevronDownIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import type { ConsentVersion } from '@repo/schema/consents';
import { czechDateTime } from '@repo/schema/shared';

import { Card } from '@/components/ui/card';
import { ConsentPreview } from '@/features/camps/components/consents-section/consent-preview';

interface ConsentVersionsProps {
  versions: readonly ConsentVersion[];
}

// Every published version of a Consent as guardians signed it, newest first.
export function ConsentVersions({ versions }: ConsentVersionsProps) {
  const { t } = useTranslation('camps');

  return (
    <Card>
      <details className="group">
        <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 [&::-webkit-details-marker]:hidden">
          <h3 className="text-heading">{t('consents.versions')}</h3>
          <ChevronDownIcon
            aria-hidden="true"
            className="size-5 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
          />
        </summary>
        <div className="mt-4 flex flex-col gap-5">
          {versions.map((version) => (
            <div key={version.id} className="flex flex-col gap-2">
              <p className="text-[13px] text-muted-foreground">
                {t('consents.versionOf', { version: version.version, date: czechDateTime(version.publishedAt) })}
                {version.file === null
                  ? null
                  : ` · ${t('consents.fingerprint', { sha256: version.file.sha256.slice(0, 16) })}`}
              </p>
              <ConsentPreview
                title={version.title}
                introduction={version.introduction}
                items={version.items}
                withdrawable={version.withdrawable}
                fileUrl={version.file?.link.url ?? null}
              />
            </div>
          ))}
        </div>
      </details>
    </Card>
  );
}
