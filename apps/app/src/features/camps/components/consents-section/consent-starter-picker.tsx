import { useTranslation } from 'react-i18next';

import { STARTER_CONSENTS, type StarterConsent } from '@repo/schema/consents';

import { Button } from '@/components/ui/button';

interface ConsentStarterPickerProps {
  onStartNew: (from: StarterConsent | null) => void;
}

// A new Consent from one of the starters, or from a blank page.
export function ConsentStarterPicker({ onStartNew }: ConsentStarterPickerProps) {
  const { t } = useTranslation('camps');

  return (
    <div className="flex flex-col gap-2.5 rounded-[22px] border border-dashed border-input px-4.5 py-4">
      <span className="font-semibold">{t('consents.new')}</span>
      <span className="text-[13px] text-muted-foreground">{t('consents.fromStarter')}</span>
      <div className="flex flex-wrap gap-1.5">
        {STARTER_CONSENTS.map((from) => (
          <Button key={from.key} type="button" size="sm" variant="secondary" onClick={() => onStartNew(from)}>
            {from.title}
          </Button>
        ))}
        <Button type="button" size="sm" variant="secondary" onClick={() => onStartNew(null)}>
          {t('consents.blank')}
        </Button>
      </div>
    </div>
  );
}
