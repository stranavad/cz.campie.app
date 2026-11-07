import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { czechDate } from '@repo/schema/shared';

import { Button } from '@/components/ui/button';
import { useDocumentTypesQuery } from '@/features/camps/api/camps.queries';
import { DocumentTypeForm } from '@/features/camps/components/document-types-section/document-type-form';

interface DocumentTypesSectionProps {
  organisationId: string;
  campId: string;
  canWrite: boolean;
}

// The Camp's Document types: downloads it publishes and documents each child hands in.
export function DocumentTypesSection({ organisationId, campId, canWrite }: DocumentTypesSectionProps) {
  const { t } = useTranslation('camps');
  const types = useDocumentTypesQuery(organisationId, campId);
  // null: a new type; undefined: none opened.
  const [openId, setOpenId] = useState<string | null | undefined>(undefined);

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold">{t('documentTypes.title')}</h2>
        <p className="text-sm text-muted-foreground">{t('documentTypes.intro')}</p>
      </div>
      {types.isError ? <p className="text-sm text-destructive">{t('documentTypes.loadFailed')}</p> : null}
      <ul className="flex flex-col divide-y rounded-lg border">
        {(types.data ?? []).map((type) => (
          <li key={type.id} className="flex flex-col gap-2 p-3 text-sm">
            <div className="flex flex-wrap items-center gap-3">
              <button type="button" className="font-medium underline" onClick={() => setOpenId(type.id)}>
                {type.name}
              </button>
              <span className="text-muted-foreground">{t(`documentTypes.kinds.${type.kind}`)}</span>
              {type.dueDate === null ? null : (
                <span>{t('documentTypes.dueBy', { date: czechDate(type.dueDate) })}</span>
              )}
              {type.kind === 'download' && type.file === null ? (
                <span className="text-destructive">{t('documentTypes.noFile')}</span>
              ) : null}
            </div>
            {openId === type.id ? (
              <DocumentTypeForm
                organisationId={organisationId}
                campId={campId}
                type={type}
                canWrite={canWrite}
                onDone={() => setOpenId(undefined)}
              />
            ) : null}
          </li>
        ))}
        {types.data?.length === 0 ? (
          <li className="p-3 text-sm text-muted-foreground">{t('documentTypes.none')}</li>
        ) : null}
      </ul>
      {openId === null ? (
        <DocumentTypeForm
          organisationId={organisationId}
          campId={campId}
          type={null}
          canWrite={canWrite}
          onDone={() => setOpenId(undefined)}
        />
      ) : canWrite ? (
        <Button type="button" size="sm" variant="outline" className="self-start" onClick={() => setOpenId(null)}>
          {t('documentTypes.new')}
        </Button>
      ) : null}
    </section>
  );
}
