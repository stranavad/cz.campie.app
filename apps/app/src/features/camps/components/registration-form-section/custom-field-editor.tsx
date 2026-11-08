import { ArrowDownIcon, ArrowUpIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import type { CustomField } from '@repo/schema/form-engine';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { CustomFieldSettings } from '@/features/camps/components/registration-form-section/custom-field-settings';

interface CustomFieldEditorProps {
  field: CustomField;
  canWrite: boolean;
  onChange: (field: CustomField) => void;
  onRemove: () => void;
  onMove: (by: -1 | 1) => void;
  onDone: () => void;
}

/**
 * Bring the editor into view when it opens: on a phone it sits under the list. Left alone when visible.
 * @param node the editor, or null when it unmounts
 */
function revealOnMount(node: HTMLElement | null) {
  node?.scrollIntoView({ block: 'nearest' });
}

// The open custom question's settings, moving it and removing it. Edits land in the draft at once.
export function CustomFieldEditor({ field, canWrite, onChange, onRemove, onMove, onDone }: CustomFieldEditorProps) {
  const { t } = useTranslation('camps');

  return (
    <Card ref={revealOnMount} aria-label={t('registrationForm.editorTitle')} className="scroll-mt-4">
      <CardHeader className="items-center">
        <CardTitle>{t('registrationForm.editorTitle')}</CardTitle>
        <Badge>{t(`registrationForm.types.${field.type}`)}</Badge>
      </CardHeader>
      <fieldset disabled={!canWrite} className="flex min-w-0 flex-col gap-4">
        <CustomFieldSettings field={field} onChange={onChange} />
      </fieldset>
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border-subtle pt-4">
        {canWrite ? (
          <div className="flex flex-wrap items-center gap-1">
            <Button type="button" variant="ghost" className="text-danger-foreground" onClick={onRemove}>
              {t('registrationForm.removeField')}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={t('registrationForm.moveUp')}
              onClick={() => onMove(-1)}
            >
              <ArrowUpIcon aria-hidden="true" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={t('registrationForm.moveDown')}
              onClick={() => onMove(1)}
            >
              <ArrowDownIcon aria-hidden="true" />
            </Button>
          </div>
        ) : (
          <span />
        )}
        <Button type="button" onClick={onDone}>
          {t('registrationForm.done')}
        </Button>
      </div>
    </Card>
  );
}
