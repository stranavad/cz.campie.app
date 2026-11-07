import { useTranslation } from 'react-i18next';

import { Input } from '@/components/ui/input';

interface SurchargeInputsProps {
  surcharge: number | null;
  needsVerification: boolean;
  onChange: (surcharge: number | null, needsVerification: boolean) => void;
}

// What an answer adds per child (negative for a discount), and whether the camp checks a discount.
export function SurchargeInputs({ surcharge, needsVerification, onChange }: SurchargeInputsProps) {
  const { t } = useTranslation('camps');

  return (
    <div className="flex flex-wrap items-end gap-3 text-sm">
      <label className="flex flex-col gap-1">
        {t('registrationForm.surcharge')}
        <Input
          type="number"
          className="w-28"
          value={surcharge === null ? '' : String(surcharge)}
          onChange={(event) =>
            onChange(event.target.value === '' ? null : Number(event.target.value), needsVerification)
          }
        />
      </label>
      {surcharge !== null && surcharge < 0 ? (
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={needsVerification}
            onChange={(event) => onChange(surcharge, event.target.checked)}
          />
          {t('registrationForm.needsVerification')}
        </label>
      ) : null}
    </div>
  );
}
