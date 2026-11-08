import { useId } from 'react';
import { useTranslation } from 'react-i18next';

import { Field, FieldDescription, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { VerificationCheckbox } from '@/features/camps/components/registration-form-section/verification-checkbox';

interface SurchargeInputsProps {
  surcharge: number | null;
  needsVerification: boolean;
  onChange: (surcharge: number | null, needsVerification: boolean) => void;
}

// What a yes adds per child (negative for a discount), and whether the camp checks a discount.
export function SurchargeInputs({ surcharge, needsVerification, onChange }: SurchargeInputsProps) {
  const { t } = useTranslation('camps');
  const id = useId();

  return (
    <div className="flex flex-col gap-1.5">
      <Field>
        <FieldLabel htmlFor={id}>{t('registrationForm.surchargeYes')}</FieldLabel>
        <Input
          id={id}
          type="number"
          className="sm:max-w-36"
          value={surcharge === null ? '' : String(surcharge)}
          onChange={(event) =>
            onChange(event.target.value === '' ? null : Number(event.target.value), needsVerification)
          }
        />
        <FieldDescription>{t('registrationForm.surchargeHint')}</FieldDescription>
      </Field>
      {surcharge !== null && surcharge < 0 ? (
        <VerificationCheckbox checked={needsVerification} onChange={(checked) => onChange(surcharge, checked)} />
      ) : null}
    </div>
  );
}
