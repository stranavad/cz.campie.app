import { useId } from 'react';
import { useTranslation } from 'react-i18next';

import type { PublicTurnus } from '@repo/schema/camps';
import { czechDate } from '@repo/schema/shared';

import { Card } from '@/components/ui/card';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Select } from '@/components/ui/select';

interface TurnusSectionProps {
  turnus: PublicTurnus | undefined;
  turnusy: readonly PublicTurnus[];
  onSelect: (id: string) => void;
  // Sending was tried without a Turnus.
  isMissing: boolean;
  // Why the chosen Turnus takes no Registrations now.
  closedMessage: string | null;
}

// The Turnus the Registration is for; only open ones can be picked.
export function TurnusSection({ turnus, turnusy, onSelect, isMissing, closedMessage }: TurnusSectionProps) {
  const { t } = useTranslation('registration');
  const id = useId();
  const errorId = useId();

  return (
    <Card>
      <Field>
        <FieldLabel htmlFor={id} className="font-display text-xl font-bold tracking-[-0.02em]">
          {t('turnus')}
        </FieldLabel>
        <Select
          id={id}
          value={turnus?.id ?? null}
          placeholder={t('pickTurnus')}
          onValueChange={onSelect}
          aria-invalid={isMissing || closedMessage !== null}
          aria-describedby={isMissing || closedMessage !== null ? errorId : undefined}
          options={turnusy.map((option) => ({
            value: option.id,
            disabled: option.availability !== 'open',
            label: t('turnusOption', {
              name: option.name,
              start: czechDate(option.startDate),
              end: czechDate(option.endDate),
            }),
          }))}
        />
        {isMissing ? <FieldError id={errorId}>{t('turnusRequired')}</FieldError> : null}
        {closedMessage === null ? null : <FieldError id={errorId}>{closedMessage}</FieldError>}
      </Field>
    </Card>
  );
}
