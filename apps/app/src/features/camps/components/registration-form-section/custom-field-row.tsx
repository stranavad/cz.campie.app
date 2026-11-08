import { useTranslation } from 'react-i18next';

import type { CustomField } from '@repo/schema/form-engine';

import { Badge } from '@/components/ui/badge';
import { hasSurcharge } from '@/features/camps/components/registration-form-section/custom-field.helper';

interface CustomFieldRowProps {
  field: CustomField;
  isSelected: boolean;
  onSelect: () => void;
}

// One custom question in the list; choosing it opens it in the editor.
export function CustomFieldRow({ field, isSelected, onSelect }: CustomFieldRowProps) {
  const { t } = useTranslation('camps');
  const meta = [
    t(`registrationForm.types.${field.type}`),
    t(`registrationForm.scopes.${field.scope}`),
    field.health ? t('registrationForm.health') : null,
    hasSurcharge(field) ? t('registrationForm.withSurcharge') : null,
  ].filter((part) => part !== null);

  return (
    <li className="border-t border-border-subtle">
      <button
        type="button"
        aria-pressed={isSelected}
        onClick={onSelect}
        className="flex min-h-13 w-full cursor-pointer items-center gap-2.5 rounded-2xl px-3 py-1.5 text-left transition-colors outline-none hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring aria-pressed:bg-muted aria-pressed:ring-2 aria-pressed:ring-foreground aria-pressed:ring-inset"
      >
        <span className="flex min-w-0 flex-1 flex-col leading-snug">
          <span className={isSelected ? 'font-bold' : 'font-medium'}>
            {field.label === '' ? t('registrationForm.untitled') : field.label}
          </span>
          <span className="text-[13px] text-muted-foreground">{meta.join(' · ')}</span>
        </span>
        <Badge variant="outline">{t(`registrationForm.states.${field.required ? 'required' : 'optional'}`)}</Badge>
      </button>
    </li>
  );
}
