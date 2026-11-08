import { FileTextIcon } from 'lucide-react';
import { useId } from 'react';
import { useTranslation } from 'react-i18next';

import type { DocumentType, DocumentTypeKind } from '@repo/schema/documents';

import { FileInput } from '@/components/file-input';
import { Button } from '@/components/ui/button';
import { Field, FieldLabel } from '@/components/ui/field';
import type { useDocumentTypeMutations } from '@/features/camps/api/camps.queries';

interface DocumentTypeFileFieldProps {
  type: DocumentType;
  kind: DocumentTypeKind;
  mutations: ReturnType<typeof useDocumentTypeMutations>;
}

// A saved type's file: a download's published file or a requirement's blank form, uploaded or removed at once.
export function DocumentTypeFileField({ type, kind, mutations }: DocumentTypeFileFieldProps) {
  const { t } = useTranslation('camps');
  const id = useId();

  return (
    <div className="flex flex-col gap-2">
      {type.file === null ? (
        <Field>
          <FieldLabel htmlFor={id}>
            {kind === 'download' ? t('documentTypes.file') : t('documentTypes.blankForm')}
          </FieldLabel>
          <FileInput
            id={id}
            accept="application/pdf,image/jpeg,image/png"
            disabled={mutations.setFile.isPending}
            onFile={(file) => mutations.setFile.mutate({ id: type.id, file })}
          />
        </Field>
      ) : (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border p-3">
          <FileTextIcon aria-hidden="true" className="size-5 shrink-0 text-muted-foreground" />
          <a
            href={type.file.link.url}
            target="_blank"
            rel="noreferrer"
            className="min-w-0 flex-1 font-semibold underline underline-offset-4 hover:text-brand-text"
          >
            {t('documentTypes.openFile')}
          </a>
          <Button type="button" size="sm" variant="outline" onClick={() => mutations.removeFile.mutate(type.id)}>
            {t('documentTypes.removeFile')}
          </Button>
        </div>
      )}
      {mutations.setFile.isError ? <p className="text-sm text-destructive">{t('documentTypes.uploadFailed')}</p> : null}
    </div>
  );
}
