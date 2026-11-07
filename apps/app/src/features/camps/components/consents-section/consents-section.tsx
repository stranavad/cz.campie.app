import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { czechDateTime } from '@repo/schema/shared';

import { Button } from '@/components/ui/button';
import { useConsentQuery, useConsentsQuery } from '@/features/camps/api/camps.queries';
import { ConsentEditor } from '@/features/camps/components/consents-section/consent-editor';
import { ConsentPreview } from '@/features/camps/components/consents-section/consent-preview';
import { draftOf } from '@/features/camps/components/consents-section/use-consent-editor.hook';

interface ConsentsSectionProps {
  organisationId: string;
  campId: string;
  canWrite: boolean;
}

// The Camp's Consents: the list, one opened with its versions, and the editor that publishes the next.
export function ConsentsSection({ organisationId, campId, canWrite }: ConsentsSectionProps) {
  const { t } = useTranslation('camps');
  const consents = useConsentsQuery(organisationId, campId);
  // null: a new Consent; undefined: none opened.
  const [openId, setOpenId] = useState<string | null | undefined>(undefined);
  const opened = useConsentQuery(organisationId, campId, openId ?? null);
  const [newest] = opened.data?.versions ?? [];

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold">{t('consents.title')}</h2>
        <p className="text-sm text-muted-foreground">{t('consents.intro')}</p>
      </div>
      {consents.isError ? <p className="text-sm text-destructive">{t('consents.loadFailed')}</p> : null}
      <ul className="flex flex-col divide-y rounded-lg border">
        {(consents.data ?? []).map((consent) => (
          <li key={consent.id} className="flex flex-wrap items-center gap-3 p-3 text-sm">
            <button type="button" className="font-medium underline" onClick={() => setOpenId(consent.id)}>
              {consent.title}
            </button>
            <span className="text-muted-foreground">
              {t('consents.versionOf', { version: consent.version, date: czechDateTime(consent.publishedAt) })}
            </span>
            {consent.withdrawable ? <span>{t('consents.withdrawableShort')}</span> : null}
          </li>
        ))}
        {consents.data?.length === 0 ? (
          <li className="p-3 text-sm text-muted-foreground">{t('consents.none')}</li>
        ) : null}
      </ul>
      {canWrite && openId !== null ? (
        <Button type="button" size="sm" variant="outline" className="self-start" onClick={() => setOpenId(null)}>
          {t('consents.new')}
        </Button>
      ) : null}
      {openId === null ? (
        <ConsentEditor
          key="new"
          organisationId={organisationId}
          campId={campId}
          consentId={null}
          initial={draftOf(null)}
          canWrite={canWrite}
          onSaved={setOpenId}
        />
      ) : null}
      {openId !== undefined && openId !== null && opened.data !== undefined ? (
        <div className="flex flex-col gap-4">
          <ConsentEditor
            key={`${opened.data.id}-${newest?.version ?? 0}`}
            organisationId={organisationId}
            campId={campId}
            consentId={opened.data.id}
            initial={draftOf(newest ?? null)}
            canWrite={canWrite}
            onSaved={setOpenId}
          />
          <details className="text-sm">
            <summary className="cursor-pointer font-medium">{t('consents.versions')}</summary>
            <div className="mt-3 flex flex-col gap-3">
              {opened.data.versions.map((version) => (
                <div key={version.id} className="flex flex-col gap-1">
                  <p className="text-muted-foreground">
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
        </div>
      ) : null}
    </section>
  );
}
