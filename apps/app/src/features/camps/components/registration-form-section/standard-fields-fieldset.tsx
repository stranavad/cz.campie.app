import { useTranslation } from 'react-i18next';

import { REGISTRATION_FIELD_CATALOGUE } from '@repo/schema/camps';
import { FIELD_SCOPES, type CampOption, type FormDefinition, type StandardFieldState } from '@repo/schema/form-engine';

import { StandardFieldRow } from '@/features/camps/components/registration-form-section/standard-field-row';

interface StandardFieldsFieldsetProps {
  definition: FormDefinition;
  canWrite: boolean;
  onChange: (key: string, entry: { state: StandardFieldState; options?: CampOption[] }) => void;
}

// Each standard field the platform knows, off, optional or required, in a card per where it is asked.
export function StandardFieldsFieldset({ definition, canWrite, onChange }: StandardFieldsFieldsetProps) {
  const { t } = useTranslation('camps');
  const catalogue = Object.entries(REGISTRATION_FIELD_CATALOGUE);

  return FIELD_SCOPES.map((scope) => (
    <section key={scope} className="rounded-3xl border border-border bg-card px-2 pt-1.5 pb-2">
      <fieldset disabled={!canWrite} className="min-w-0">
        <legend className="float-left flex min-h-14 w-full flex-col justify-center px-3 leading-snug">
          <span className="font-display text-lg font-bold">{t(`registrationForm.groups.${scope}`)}</span>
          <span className="text-[13px] text-muted-foreground">
            {t('registrationForm.standardNote', { scope: t(`registrationForm.scopes.${scope}`) })}
          </span>
        </legend>
        <div className="clear-left">
          {catalogue
            .filter(([, spec]) => spec.scope === scope)
            .map(([key, spec]) => {
              const entry = definition.standard.find((field) => field.key === key);

              return (
                <StandardFieldRow
                  key={key}
                  fieldKey={key}
                  spec={spec}
                  state={entry?.state ?? 'off'}
                  options={entry?.options ?? []}
                  onChange={(next) => onChange(key, next)}
                />
              );
            })}
        </div>
      </fieldset>
    </section>
  ));
}
