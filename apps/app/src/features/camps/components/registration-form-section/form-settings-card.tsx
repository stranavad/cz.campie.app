import { useId } from 'react';
import { useTranslation } from 'react-i18next';

import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { Field, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';

interface FormSettingsCardProps {
  maxParticipants: number;
  canWrite: boolean;
  onChange: (maxParticipants: number) => void;
}

// The form's own settings, beside the fields while no question is open.
export function FormSettingsCard({ maxParticipants, canWrite, onChange }: FormSettingsCardProps) {
  const { t } = useTranslation('camps');
  const id = useId();

  return (
    <Card>
      <div className="flex flex-col gap-1">
        <CardTitle>{t('registrationForm.settingsTitle')}</CardTitle>
        <CardDescription>{t('registrationForm.pickField')}</CardDescription>
      </div>
      <Field>
        <FieldLabel htmlFor={id}>{t('registrationForm.maxParticipants')}</FieldLabel>
        <Input
          id={id}
          type="number"
          inputMode="numeric"
          disabled={!canWrite}
          className="sm:max-w-32"
          value={String(maxParticipants)}
          onChange={(event) => onChange(Number(event.target.value))}
        />
      </Field>
    </Card>
  );
}
