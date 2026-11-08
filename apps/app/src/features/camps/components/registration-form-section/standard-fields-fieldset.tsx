import { useTranslation } from 'react-i18next';

import { REGISTRATION_FIELD_CATALOGUE } from '@repo/schema/camps';
import {
  STANDARD_FIELD_STATES,
  type CampOption,
  type FormDefinition,
  type StandardFieldState,
} from '@repo/schema/form-engine';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { nextOptionId } from '@/features/camps/components/registration-form-section/custom-field.helper';

interface StandardFieldsFieldsetProps {
  definition: FormDefinition;
  canWrite: boolean;
  onChange: (key: string, entry: { state: StandardFieldState; options?: CampOption[] }) => void;
}

// The camp's own options of a field that takes them: transport's boarding places.
function CampOptionsEditor({
  options,
  onChange,
}: {
  options: readonly CampOption[];
  onChange: (options: CampOption[]) => void;
}) {
  const { t } = useTranslation('camps');

  return (
    <div className="flex flex-col gap-2 border-l-2 border-border pl-3">
      <span className="text-sm font-medium">{t('registrationForm.boardingPlaces')}</span>
      <span className="text-sm text-muted-foreground">{t('registrationForm.boardingPlacesHint')}</span>
      {options.map((option, index) => (
        <div key={option.id} className="flex items-center gap-2">
          <Input
            aria-label={t('registrationForm.boardingPlace')}
            value={option.label}
            onChange={(event) =>
              onChange(
                options.map((current, at) => (at === index ? { ...option, label: event.target.value } : current)),
              )
            }
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
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="self-start"
        onClick={() => onChange([...options, { id: nextOptionId(options.map(({ id }) => id)), label: '' }])}
      >
        {t('registrationForm.addBoardingPlace')}
      </Button>
    </div>
  );
}

// Each standard field the platform knows, off, optional or required, and transport's boarding places.
export function StandardFieldsFieldset({ definition, canWrite, onChange }: StandardFieldsFieldsetProps) {
  const { t } = useTranslation('camps');
  const { t: tCommon } = useTranslation();

  return (
    <fieldset disabled={!canWrite} className="flex flex-col gap-2">
      <legend className="mb-1 font-medium">{t('registrationForm.standard')}</legend>
      {Object.entries(REGISTRATION_FIELD_CATALOGUE).map(([key, spec]) => {
        const entry = definition.standard.find((field) => field.key === key);
        const state = entry?.state ?? 'off';
        const options = entry?.options ?? [];

        return (
          <div key={key} className="flex flex-col gap-2">
            <label className="flex items-center justify-between gap-3 text-sm">
              <span>
                {tCommon(spec.labelKey, key)}
                {spec.sensitivity === 'plain' ? null : (
                  <span className="ml-2 text-muted-foreground">
                    {t(`registrationForm.sensitivity.${spec.sensitivity}`)}
                  </span>
                )}
              </span>
              <select
                className="rounded border border-input bg-transparent px-1"
                value={state}
                onChange={(event) =>
                  onChange(key, {
                    state: STANDARD_FIELD_STATES.find((candidate) => candidate === event.target.value) ?? 'off',
                    ...(spec.input === 'camp_choice' ? { options } : {}),
                  })
                }
              >
                {STANDARD_FIELD_STATES.map((candidate) => (
                  <option key={candidate} value={candidate}>
                    {t(`registrationForm.states.${candidate}`)}
                  </option>
                ))}
              </select>
            </label>
            {spec.input === 'camp_choice' && state !== 'off' ? (
              <CampOptionsEditor options={options} onChange={(next) => onChange(key, { state, options: next })} />
            ) : null}
          </div>
        );
      })}
    </fieldset>
  );
}
