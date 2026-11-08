import { useTranslation } from 'react-i18next';

import type { ChoiceOption } from '@repo/schema/form-engine';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { nextOptionId } from '@/features/camps/components/registration-form-section/custom-field.helper';
import { SurchargeInputs } from '@/features/camps/components/registration-form-section/surcharge-inputs';

interface OptionsEditorProps {
  options: readonly ChoiceOption[];
  // Whether options may carry a surcharge; health data may not.
  surcharges: boolean;
  onChange: (options: ChoiceOption[]) => void;
}

// A choice's options, each with its label and what it adds or takes off per child.
export function OptionsEditor({ options, surcharges, onChange }: OptionsEditorProps) {
  const { t } = useTranslation('camps');
  const replace = (index: number, option: ChoiceOption) =>
    onChange(options.map((current, at) => (at === index ? option : current)));

  return (
    <div className="flex flex-col gap-3">
      <span className="text-sm font-medium">{t('registrationForm.options')}</span>
      {options.map((option, index) => (
        <div key={option.id} className="flex flex-col gap-2 border-l-2 border-border pl-3">
          <div className="flex items-center gap-2">
            <Input
              aria-label={t('registrationForm.optionLabel')}
              value={option.label}
              onChange={(event) => replace(index, { ...option, label: event.target.value })}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onChange(options.filter((_, at) => at !== index))}
            >
              {t('registrationForm.removeOption')}
            </Button>
          </div>
          {surcharges ? (
            <SurchargeInputs
              surcharge={option.surcharge}
              needsVerification={option.needsVerification}
              onChange={(surcharge, needsVerification) => replace(index, { ...option, surcharge, needsVerification })}
            />
          ) : null}
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="self-start"
        onClick={() =>
          onChange([
            ...options,
            { id: nextOptionId(options.map(({ id }) => id)), label: '', surcharge: null, needsVerification: false },
          ])
        }
      >
        {t('registrationForm.addOption')}
      </Button>
    </div>
  );
}
