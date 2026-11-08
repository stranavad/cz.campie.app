import { useId } from 'react';
import { useTranslation } from 'react-i18next';

import type { Turnus } from '@repo/schema/camps';

import { Checkbox } from '@/components/ui/checkbox';
import { FieldDescription, FieldLegend, FieldSet } from '@/components/ui/field';
import { Label } from '@/components/ui/label';

interface DocumentTypeTurnusPickerProps {
  turnusy: readonly Turnus[];
  chosen: readonly string[];
  canWrite: boolean;
  onChoose: (turnusId: string, chosen: boolean) => void;
}

// The Turnusy a download is for; none chosen means every Turnus.
export function DocumentTypeTurnusPicker({ turnusy, chosen, canWrite, onChoose }: DocumentTypeTurnusPickerProps) {
  const { t } = useTranslation('camps');
  const id = useId();

  return (
    <FieldSet className="gap-1 md:col-span-2">
      <FieldLegend variant="label">{t('documentTypes.turnusy')}</FieldLegend>
      <div className="flex flex-wrap gap-x-6">
        {turnusy.map((turnus) => (
          <Label key={turnus.id} htmlFor={`${id}-${turnus.id}`} className="min-h-11 font-normal">
            <Checkbox
              id={`${id}-${turnus.id}`}
              checked={chosen.includes(turnus.id)}
              disabled={!canWrite}
              onCheckedChange={(checked) => onChoose(turnus.id, checked)}
            />
            {turnus.name}
          </Label>
        ))}
      </div>
      <FieldDescription>{t('documentTypes.allTurnusy')}</FieldDescription>
    </FieldSet>
  );
}
