import type { RegistrationForm } from '@repo/schema/camps';

import { CustomFieldEditor } from '@/features/camps/components/registration-form-section/custom-field-editor';
import { CustomFieldsCard } from '@/features/camps/components/registration-form-section/custom-fields-card';
import { DeclarationsEditor } from '@/features/camps/components/registration-form-section/declarations-editor';
import { FormPreview } from '@/features/camps/components/registration-form-section/form-preview';
import { FormSettingsCard } from '@/features/camps/components/registration-form-section/form-settings-card';
import { PublishBar } from '@/features/camps/components/registration-form-section/publish-bar';
import { StandardFieldsFieldset } from '@/features/camps/components/registration-form-section/standard-fields-fieldset';
import { useRegistrationFormBuilder } from '@/features/camps/components/registration-form-section/use-registration-form-builder.hook';

interface RegistrationFormBuilderProps {
  organisationId: string;
  campId: string;
  form: RegistrationForm;
  canWrite: boolean;
}

// The draft's fields grouped in cards on the left, the open question's editor on the right; saving and
// publishing at the top, over the whole draft.
export function RegistrationFormBuilder({ organisationId, campId, form, canWrite }: RegistrationFormBuilderProps) {
  const builder = useRegistrationFormBuilder(organisationId, campId, form);
  const { selected } = builder;

  return (
    <div className="flex flex-col gap-4">
      <PublishBar
        latest={form.latest}
        hasChanges={builder.hasChanges}
        status={builder.status}
        canWrite={canWrite}
        isSaving={builder.isSaving}
        isPreviewing={builder.isPreviewing}
        onSave={builder.save}
        onPublish={builder.publish}
        onDiscard={builder.discard}
        onTogglePreview={builder.togglePreview}
      />
      {builder.isPreviewing ? (
        <FormPreview definition={builder.definition} declarations={builder.previewDeclarations} />
      ) : null}
      <div className="grid items-start gap-4 lg:grid-cols-5">
        <div className="flex min-w-0 flex-col gap-3 lg:col-span-3">
          <StandardFieldsFieldset
            definition={builder.definition}
            canWrite={canWrite}
            onChange={builder.setStandardField}
          />
          <CustomFieldsCard
            fields={builder.definition.custom}
            selectedId={selected?.id ?? null}
            canWrite={canWrite}
            newType={builder.newType}
            onSelect={builder.select}
            onNewTypeChange={builder.setNewType}
            onAdd={builder.addField}
          />
          <DeclarationsEditor
            organisationId={organisationId}
            campId={campId}
            declarations={builder.declarations}
            canWrite={canWrite}
            onChange={builder.setDeclarations}
            linkOf={builder.linkOf}
          />
        </div>
        <div className="min-w-0 lg:col-span-2">
          {selected === null ? (
            <FormSettingsCard
              maxParticipants={builder.maxParticipants}
              canWrite={canWrite}
              onChange={builder.setMaxParticipants}
            />
          ) : (
            <CustomFieldEditor
              key={selected.id}
              field={selected}
              canWrite={canWrite}
              onChange={builder.updateField}
              onRemove={() => builder.removeField(selected.id)}
              onMove={(by) => builder.moveField(selected.id, by)}
              onDone={() => builder.select(null)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
