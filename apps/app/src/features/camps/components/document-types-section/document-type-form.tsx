import { useId } from 'react';
import { useTranslation } from 'react-i18next';

import { DOCUMENT_TYPE_KINDS, type DocumentType } from '@repo/schema/documents';

import { DatePicker } from '@/components/date-picker/date-picker';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { DocumentTypeFileField } from '@/features/camps/components/document-types-section/document-type-file-field';
import { DocumentTypeTurnusPicker } from '@/features/camps/components/document-types-section/document-type-turnus-picker';
import { useDocumentTypeForm } from '@/features/camps/components/document-types-section/use-document-type-form.hook';

interface DocumentTypeFormProps {
  organisationId: string;
  campId: string;
  type: DocumentType | null;
  canWrite: boolean;
  onDone: () => void;
}

// One Document type: its kind, name and description, a requirement's due date or a download's Turnusy, and
// its file once it exists.
export function DocumentTypeForm({ organisationId, campId, type, canWrite, onDone }: DocumentTypeFormProps) {
  const { t } = useTranslation('camps');
  const form = useDocumentTypeForm(organisationId, campId, type);
  const id = useId();

  return (
    <Card className="md:col-span-2">
      <CardHeader>
        <CardTitle className="break-words">{type === null ? t('documentTypes.new') : type.name}</CardTitle>
      </CardHeader>
      <fieldset disabled={!canWrite} className="flex min-w-0 flex-col gap-5">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <Field>
            <FieldLabel htmlFor={`${id}-kind`}>{t('documentTypes.kind')}</FieldLabel>
            <Select
              id={`${id}-kind`}
              value={form.kind}
              onValueChange={form.setKind}
              options={DOCUMENT_TYPE_KINDS.map((known) => ({ value: known, label: t(`documentTypes.kinds.${known}`) }))}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor={`${id}-name`}>{t('documentTypes.name')}</FieldLabel>
            <Input id={`${id}-name`} value={form.name} onChange={(event) => form.setName(event.target.value)} />
          </Field>
          <Field className="md:col-span-2">
            <FieldLabel htmlFor={`${id}-description`}>{t('documentTypes.description')}</FieldLabel>
            <Textarea
              id={`${id}-description`}
              rows={2}
              value={form.description}
              onChange={(event) => form.setDescription(event.target.value)}
            />
          </Field>
          {form.kind === 'requirement' ? (
            <Field>
              <FieldLabel htmlFor={`${id}-due`}>{t('documentTypes.dueDate')}</FieldLabel>
              <DatePicker id={`${id}-due`} value={form.dueDate} onChange={form.setDueDate} clearable />
            </Field>
          ) : (
            <DocumentTypeTurnusPicker
              turnusy={form.turnusy}
              chosen={form.turnusIds}
              canWrite={canWrite}
              onChoose={form.setTurnusChosen}
            />
          )}
        </div>
        {type === null ? (
          <p className="text-sm text-muted-foreground">{t('documentTypes.fileAfterSave')}</p>
        ) : (
          <DocumentTypeFileField type={type} kind={form.kind} mutations={form.mutations} />
        )}
        {form.saveFailed ? (
          <Alert variant="danger" role="alert">
            {t('documentTypes.saveFailed')}
          </Alert>
        ) : null}
        <CardFooter>
          {type === null ? null : (
            <Button type="button" variant="outline" onClick={() => form.remove(onDone)}>
              {t('documentTypes.remove')}
            </Button>
          )}
          <span className="flex-1" />
          <Button type="button" variant="ghost" onClick={onDone}>
            {t('documentTypes.cancel')}
          </Button>
          <Button type="button" disabled={!form.canSave} onClick={() => form.save(onDone)}>
            {t('documentTypes.save')}
          </Button>
        </CardFooter>
      </fieldset>
    </Card>
  );
}
