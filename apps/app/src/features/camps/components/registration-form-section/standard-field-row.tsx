import { useId } from 'react';
import { useTranslation } from 'react-i18next';

import type { REGISTRATION_FIELD_CATALOGUE } from '@repo/schema/camps';
import { STANDARD_FIELD_STATES, type CampOption, type StandardFieldState } from '@repo/schema/form-engine';

import { Select } from '@/components/ui/select';
import { CampOptionsEditor } from '@/features/camps/components/registration-form-section/camp-options-editor';

type FieldSpec = (typeof REGISTRATION_FIELD_CATALOGUE)[keyof typeof REGISTRATION_FIELD_CATALOGUE];

interface StandardFieldRowProps {
  fieldKey: string;
  spec: FieldSpec;
  state: StandardFieldState;
  options: readonly CampOption[];
  onChange: (entry: { state: StandardFieldState; options?: CampOption[] }) => void;
}

// One standard field: its name, how sensitive it is, whether it is asked, and transport's boarding places.
export function StandardFieldRow({ fieldKey, spec, state, options, onChange }: StandardFieldRowProps) {
  const { t } = useTranslation('camps');
  const { t: tCommon } = useTranslation();
  const id = useId();

  return (
    <div className="border-t border-border-subtle px-3">
      <div className="flex min-h-13 items-center gap-2.5 py-1.5">
        <label htmlFor={id} className="flex min-w-0 flex-1 flex-col leading-snug">
          <span className="font-medium">{tCommon(spec.labelKey, fieldKey)}</span>
          {spec.sensitivity === 'plain' ? null : (
            <span className="text-[13px] text-muted-foreground">
              {t(`registrationForm.sensitivity.${spec.sensitivity}`)}
            </span>
          )}
        </label>
        <Select
          id={id}
          variant="chip"
          value={state}
          onValueChange={(next) =>
            onChange({ state: next, ...(spec.input === 'camp_choice' ? { options: [...options] } : {}) })
          }
          options={STANDARD_FIELD_STATES.map((candidate) => ({
            value: candidate,
            label: t(`registrationForm.states.${candidate}`),
          }))}
        />
      </div>
      {spec.input === 'camp_choice' && state !== 'off' ? (
        <CampOptionsEditor options={options} onChange={(next) => onChange({ state, options: next })} />
      ) : null}
    </div>
  );
}
