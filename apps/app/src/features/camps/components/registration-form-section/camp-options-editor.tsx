import { PlusIcon, XIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import type { CampOption } from '@repo/schema/form-engine';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { nextOptionId } from '@/features/camps/components/registration-form-section/custom-field.helper';

interface CampOptionsEditorProps {
  options: readonly CampOption[];
  onChange: (options: CampOption[]) => void;
}

// The camp's own options of a field that takes them: transport's boarding places.
export function CampOptionsEditor({ options, onChange }: CampOptionsEditorProps) {
  const { t } = useTranslation('camps');

  return (
    <div className="mb-3 flex flex-col gap-2 rounded-2xl bg-muted p-3">
      <span className="text-sm font-semibold">{t('registrationForm.boardingPlaces')}</span>
      <span className="text-[13px] text-muted-foreground">{t('registrationForm.boardingPlacesHint')}</span>
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
            size="icon"
            aria-label={t('registrationForm.removeOption')}
            onClick={() => onChange(options.filter((_, at) => at !== index))}
          >
            <XIcon aria-hidden="true" />
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="self-start"
        onClick={() => onChange([...options, { id: nextOptionId(options.map(({ id }) => id)), label: '' }])}
      >
        <PlusIcon aria-hidden="true" />
        {t('registrationForm.addBoardingPlace')}
      </Button>
    </div>
  );
}
