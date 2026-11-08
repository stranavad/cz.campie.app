import { FileTextIcon, PlusIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { EmptyState } from '@/components/empty-state';
import { Button } from '@/components/ui/button';
import { DocumentTypeCard } from '@/features/camps/components/document-types-section/document-type-card';
import { DocumentTypeForm } from '@/features/camps/components/document-types-section/document-type-form';
import { useDocumentTypesSection } from '@/features/camps/components/document-types-section/use-document-types-section.hook';

interface DocumentTypesSectionProps {
  organisationId: string;
  campId: string;
  canWrite: boolean;
}

// The Camp's Document types: downloads it publishes and documents each child hands in.
export function DocumentTypesSection({ organisationId, campId, canWrite }: DocumentTypesSectionProps) {
  const { t } = useTranslation('camps');
  const section = useDocumentTypesSection(organisationId, campId);
  const { openId } = section;

  return (
    <div className="flex flex-col gap-4">
      <p className="max-w-3xl text-muted-foreground">{t('documentTypes.intro')}</p>
      {section.types.isError ? <p className="text-sm text-destructive">{t('documentTypes.loadFailed')}</p> : null}
      {section.types.isPending ? <p className="text-muted-foreground">{t('loading')}</p> : null}
      {section.hasNone && openId !== null ? (
        <EmptyState
          icon={<FileTextIcon aria-hidden="true" />}
          title={t('documentTypes.none')}
          action={
            canWrite ? (
              <Button type="button" variant="dashed" onClick={() => section.open(null)}>
                <PlusIcon aria-hidden="true" />
                {t('documentTypes.new')}
              </Button>
            ) : undefined
          }
        />
      ) : null}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {(section.types.data ?? []).map((type) =>
          openId === type.id ? (
            <DocumentTypeForm
              key={type.id}
              organisationId={organisationId}
              campId={campId}
              type={type}
              canWrite={canWrite}
              onDone={section.close}
            />
          ) : (
            <DocumentTypeCard
              key={type.id}
              type={type}
              turnusNames={section.turnusNamesOf(type)}
              canWrite={canWrite}
              onEdit={() => section.open(type.id)}
            />
          ),
        )}
        {openId === null ? (
          <DocumentTypeForm
            organisationId={organisationId}
            campId={campId}
            type={null}
            canWrite={canWrite}
            onDone={section.close}
          />
        ) : null}
        {openId !== null && canWrite && !section.hasNone && section.types.data !== undefined ? (
          <Button
            type="button"
            variant="dashed"
            className="h-auto min-h-50 rounded-3xl whitespace-normal"
            onClick={() => section.open(null)}
          >
            <PlusIcon aria-hidden="true" />
            {t('documentTypes.new')}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
