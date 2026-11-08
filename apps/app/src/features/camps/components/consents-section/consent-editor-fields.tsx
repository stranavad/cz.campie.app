import { PlusIcon } from 'lucide-react';
import { useId } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Field, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ConsentFileField } from '@/features/camps/components/consents-section/consent-file-field';
import { ConsentItemEditor } from '@/features/camps/components/consents-section/consent-item-editor';
import type { useConsentEditor } from '@/features/camps/components/consents-section/use-consent-editor.hook';

interface ConsentEditorFieldsProps {
  editor: ReturnType<typeof useConsentEditor>;
  canWrite: boolean;
}

// What a Consent says: title, introduction, the items guardians answer, whether it can be withdrawn, its PDF.
export function ConsentEditorFields({ editor, canWrite }: ConsentEditorFieldsProps) {
  const { t } = useTranslation('camps');
  const id = useId();
  const { draft } = editor;

  return (
    <fieldset disabled={!canWrite} className="flex min-w-0 flex-col gap-5">
      <Field>
        <FieldLabel htmlFor={`${id}-title`}>{t('consents.titleLabel')}</FieldLabel>
        <Input id={`${id}-title`} value={draft.title} onChange={(event) => editor.setTitle(event.target.value)} />
      </Field>
      <Field>
        <FieldLabel htmlFor={`${id}-introduction`}>{t('consents.introduction')}</FieldLabel>
        <Textarea
          id={`${id}-introduction`}
          rows={3}
          value={draft.introduction}
          onChange={(event) => editor.setIntroduction(event.target.value)}
        />
      </Field>
      <div className="flex flex-col gap-2">
        <span className="text-sm font-semibold">{t('consents.items')}</span>
        {draft.items.map((item, index) => (
          <ConsentItemEditor
            key={item.id}
            item={item}
            canRemove={draft.items.length > 1}
            onText={(text) => editor.setItemText(index, item, text)}
            onKind={(kind) => editor.setItemKind(index, item, kind)}
            onRemove={() => editor.removeItem(index)}
          />
        ))}
        <Button type="button" size="sm" variant="dashed" className="self-start" onClick={editor.addItem}>
          <PlusIcon aria-hidden="true" />
          {t('consents.addItem')}
        </Button>
      </div>
      <Field orientation="horizontal">
        <Checkbox
          id={`${id}-withdrawable`}
          checked={draft.withdrawable}
          disabled={!canWrite}
          onCheckedChange={(checked) => editor.setWithdrawable(checked)}
        />
        <FieldLabel htmlFor={`${id}-withdrawable`} className="font-normal">
          {t('consents.withdrawable')}
        </FieldLabel>
      </Field>
      <ConsentFileField
        file={draft.file}
        isUploading={editor.isUploading}
        uploadFailed={editor.uploadFailed}
        onAttach={editor.attach}
        onDetach={editor.detach}
      />
    </fieldset>
  );
}
