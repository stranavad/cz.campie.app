import { FileTextIcon } from 'lucide-react';
import { useId } from 'react';
import { useTranslation } from 'react-i18next';

import { FileInput } from '@/components/file-input';
import { Button } from '@/components/ui/button';
import { Field, FieldLabel } from '@/components/ui/field';
import type { ConsentDraft } from '@/features/camps/components/consents-section/use-consent-editor.hook';

interface ConsentFileFieldProps {
  file: ConsentDraft['file'];
  isUploading: boolean;
  uploadFailed: boolean;
  onAttach: (file: File) => void;
  onDetach: () => void;
}

// The Consent's own PDF, such as the camp rules: picked and uploaded, or the one attached to read or drop.
export function ConsentFileField({ file, isUploading, uploadFailed, onAttach, onDetach }: ConsentFileFieldProps) {
  const { t } = useTranslation('camps');
  const id = useId();

  return (
    <div className="flex flex-col gap-2">
      {file === null ? (
        <Field>
          <FieldLabel htmlFor={id}>{t('consents.attach')}</FieldLabel>
          <FileInput id={id} accept="application/pdf" disabled={isUploading} onFile={onAttach} />
        </Field>
      ) : (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border p-3">
          <FileTextIcon aria-hidden="true" className="size-5 shrink-0 text-muted-foreground" />
          <a
            href={file.link.url}
            target="_blank"
            rel="noreferrer"
            className="min-w-0 flex-1 font-semibold underline underline-offset-4 hover:text-brand-text"
          >
            {t('consents.attached')}
          </a>
          <Button type="button" size="sm" variant="outline" onClick={onDetach}>
            {t('consents.detach')}
          </Button>
        </div>
      )}
      {isUploading ? <p className="text-sm text-muted-foreground">{t('consents.uploading')}</p> : null}
      {uploadFailed ? <p className="text-sm text-destructive">{t('consents.uploadFailed')}</p> : null}
    </div>
  );
}
