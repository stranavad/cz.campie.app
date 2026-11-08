import { PlusIcon, XIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import type { ChoiceOption } from '@repo/schema/form-engine';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { nextOptionId } from '@/features/camps/components/registration-form-section/custom-field.helper';
import { VerificationCheckbox } from '@/features/camps/components/registration-form-section/verification-checkbox';
import { cn } from '@/lib/utils';

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
  const columns = surcharges ? 'grid-cols-[minmax(0,1fr)_6.5rem_2.75rem]' : 'grid-cols-[minmax(0,1fr)_2.75rem]';

  return (
    <div className="flex flex-col gap-2">
      <div className={cn('grid gap-2 text-[13px] text-muted-foreground', columns)}>
        <span>{t('registrationForm.options')}</span>
        {surcharges ? <span>{t('registrationForm.surchargeShort')}</span> : null}
      </div>
      {options.map((option, index) => (
        <div key={option.id} className="flex flex-col gap-1.5">
          <div className={cn('grid items-center gap-2', columns)}>
            <Input
              aria-label={t('registrationForm.optionLabel')}
              value={option.label}
              onChange={(event) => replace(index, { ...option, label: event.target.value })}
            />
            {surcharges ? (
              <Input
                type="number"
                aria-label={t('registrationForm.surcharge')}
                value={option.surcharge === null ? '' : String(option.surcharge)}
                onChange={(event) =>
                  replace(index, {
                    ...option,
                    surcharge: event.target.value === '' ? null : Number(event.target.value),
                  })
                }
              />
            ) : null}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={t('registrationForm.removeOption')}
              onClick={() => onChange(options.filter((_, at) => at !== index))}
            >
              <XIcon aria-hidden="true" />
            </Button>
          </div>
          {surcharges && option.surcharge !== null && option.surcharge < 0 ? (
            <VerificationCheckbox
              checked={option.needsVerification}
              onChange={(needsVerification) => replace(index, { ...option, needsVerification })}
            />
          ) : null}
        </div>
      ))}
      {surcharges ? (
        <span className="text-[13px] text-muted-foreground">{t('registrationForm.surchargeHint')}</span>
      ) : null}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="self-start"
        onClick={() =>
          onChange([
            ...options,
            { id: nextOptionId(options.map(({ id }) => id)), label: '', surcharge: null, needsVerification: false },
          ])
        }
      >
        <PlusIcon aria-hidden="true" />
        {t('registrationForm.addOption')}
      </Button>
    </div>
  );
}
