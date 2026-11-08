import { FileSignatureIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { EmptyState } from '@/components/empty-state';
import { ConsentEditor } from '@/features/camps/components/consents-section/consent-editor';
import { ConsentList } from '@/features/camps/components/consents-section/consent-list';
import { ConsentVersions } from '@/features/camps/components/consents-section/consent-versions';
import { draftOf } from '@/features/camps/components/consents-section/use-consent-editor.hook';
import { useConsentsSection } from '@/features/camps/components/consents-section/use-consents-section.hook';

interface ConsentsSectionProps {
  organisationId: string;
  campId: string;
  canWrite: boolean;
}

// The Camp's Consents: the list, one opened with its versions, and the editor that publishes the next.
export function ConsentsSection({ organisationId, campId, canWrite }: ConsentsSectionProps) {
  const { t } = useTranslation('camps');
  const section = useConsentsSection(organisationId, campId);
  const { openId, opened, newest } = section;

  return (
    <div className="flex flex-col gap-4">
      <p className="max-w-3xl text-muted-foreground">{t('consents.intro')}</p>
      {section.consents.isError ? <p className="text-sm text-destructive">{t('consents.loadFailed')}</p> : null}
      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <ConsentList
          consents={section.consents.data ?? []}
          openId={openId}
          canWrite={canWrite}
          onOpen={section.open}
          onStartNew={section.startNew}
        />
        <div className="flex min-w-0 flex-col gap-4">
          {openId === undefined && section.hasNone ? (
            <EmptyState icon={<FileSignatureIcon aria-hidden="true" />} title={t('consents.none')} />
          ) : null}
          {openId === undefined && section.consents.data !== undefined && !section.hasNone ? (
            <EmptyState icon={<FileSignatureIcon aria-hidden="true" />} title={t('consents.pick')} />
          ) : null}
          {openId === null ? (
            <ConsentEditor
              key={section.newKey}
              organisationId={organisationId}
              campId={campId}
              consentId={null}
              initial={section.newDraft()}
              nextVersion={1}
              canWrite={canWrite}
              onSaved={section.open}
            />
          ) : null}
          {typeof openId === 'string' && opened.isPending ? (
            <p className="text-muted-foreground">{t('loading')}</p>
          ) : null}
          {typeof openId === 'string' && opened.data !== undefined ? (
            <>
              <ConsentEditor
                key={`${opened.data.id}-${newest?.version ?? 0}`}
                organisationId={organisationId}
                campId={campId}
                consentId={opened.data.id}
                initial={draftOf(newest ?? null)}
                nextVersion={section.nextVersion}
                canWrite={canWrite}
                onSaved={section.open}
              />
              <ConsentVersions versions={opened.data.versions} />
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
