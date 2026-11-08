import { useTranslation } from 'react-i18next';

interface VerificationCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
}

// Whether the camp checks a discount before it counts.
export function VerificationCheckbox({ checked, onChange }: VerificationCheckboxProps) {
  const { t } = useTranslation('camps');

  return (
    <label className="flex min-h-11 cursor-pointer items-center gap-2.5 text-sm has-disabled:cursor-not-allowed">
      <input
        type="checkbox"
        className="size-4.5 shrink-0 cursor-pointer accent-primary disabled:cursor-not-allowed"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      {t('registrationForm.needsVerification')}
    </label>
  );
}
