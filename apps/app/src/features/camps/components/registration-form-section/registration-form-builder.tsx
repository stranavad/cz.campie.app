import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { RegistrationForm } from '@repo/schema/camps';
import { CUSTOM_FIELD_TYPES, type CustomFieldType } from '@repo/schema/form-engine';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CustomFieldEditor } from '@/features/camps/components/registration-form-section/custom-field-editor';
import { DeclarationsEditor } from '@/features/camps/components/registration-form-section/declarations-editor';
import { FormPreview } from '@/features/camps/components/registration-form-section/form-preview';
import { StandardFieldsFieldset } from '@/features/camps/components/registration-form-section/standard-fields-fieldset';
import { useRegistrationFormBuilder } from '@/features/camps/components/registration-form-section/use-registration-form-builder.hook';

interface RegistrationFormBuilderProps {
  organisationId: string;
  campId: string;
  form: RegistrationForm;
  canWrite: boolean;
}

export function RegistrationFormBuilder({ organisationId, campId, form, canWrite }: RegistrationFormBuilderProps) {
  const { t } = useTranslation('camps');
  const builder = useRegistrationFormBuilder(organisationId, campId, form);
  const [newType, setNewType] = useState<CustomFieldType>('short_text');
  const [isPreviewing, setPreviewing] = useState(false);

  return (
    <div className="flex flex-col gap-5">
      <p className="text-sm text-muted-foreground">
        {form.latest === null
          ? t('registrationForm.unpublished')
          : t('registrationForm.latest', { version: form.latest.version })}
      </p>
      <label className="flex max-w-xs flex-col gap-1 text-sm">
        {t('registrationForm.maxParticipants')}
        <Input
          type="number"
          disabled={!canWrite}
          value={String(builder.maxParticipants)}
          onChange={(event) => builder.setMaxParticipants(Number(event.target.value))}
        />
      </label>
      <StandardFieldsFieldset definition={builder.definition} canWrite={canWrite} onChange={builder.setStandardField} />
      <div className="flex flex-col gap-3">
        <h3 className="font-medium">{t('registrationForm.custom')}</h3>
        {builder.definition.custom.map((field) => (
          <CustomFieldEditor
            key={field.id}
            field={field}
            canWrite={canWrite}
            onChange={builder.updateField}
            onRemove={() => builder.removeField(field.id)}
            onMove={(by) => builder.moveField(field.id, by)}
          />
        ))}
        {canWrite ? (
          <div className="flex flex-wrap items-center gap-2">
            <select
              aria-label={t('registrationForm.newFieldType')}
              className="h-8 rounded-lg border border-input bg-transparent px-2 text-sm"
              value={newType}
              onChange={(event) =>
                setNewType(CUSTOM_FIELD_TYPES.find((type) => type === event.target.value) ?? 'short_text')
              }
            >
              {CUSTOM_FIELD_TYPES.map((type) => (
                <option key={type} value={type}>
                  {t(`registrationForm.types.${type}`)}
                </option>
              ))}
            </select>
            <Button
              type="button"
              variant="outline"
              onClick={() => builder.addField(newType, t(`registrationForm.types.${newType}`))}
            >
              {t('registrationForm.addField')}
            </Button>
          </div>
        ) : null}
      </div>
      <DeclarationsEditor
        organisationId={organisationId}
        campId={campId}
        declarations={builder.declarations}
        canWrite={canWrite}
        onChange={builder.setDeclarations}
        linkOf={builder.linkOf}
      />
      {builder.status === null ? null : (
        <p role={builder.status === 'saved' || builder.status === 'published' ? 'status' : 'alert'} className="text-sm">
          {t(`registrationForm.status.${builder.status}`)}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        {canWrite ? (
          <>
            <Button type="button" variant="outline" disabled={builder.isSaving} onClick={builder.save}>
              {t('registrationForm.saveDraft')}
            </Button>
            <Button type="button" disabled={builder.isSaving} onClick={builder.publish}>
              {t('registrationForm.publish')}
            </Button>
          </>
        ) : null}
        <Button type="button" variant="ghost" onClick={() => setPreviewing(!isPreviewing)}>
          {isPreviewing ? t('registrationForm.hidePreview') : t('registrationForm.showPreview')}
        </Button>
      </div>
      {isPreviewing ? (
        <FormPreview
          definition={builder.definition}
          declarations={builder.declarations.map((declaration) => ({
            ...declaration,
            file:
              declaration.file === null
                ? null
                : { ...declaration.file, link: { ...declaration.file.link, url: builder.linkOf(declaration) ?? '' } },
          }))}
        />
      ) : null}
    </div>
  );
}
