import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';

interface PickerClearButtonProps {
  disabled: boolean;
  onClick: () => void;
}

// Empties an optional date or time.
export function PickerClearButton({ disabled, onClick }: PickerClearButtonProps) {
  const { t } = useTranslation();

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="text-muted-foreground"
      disabled={disabled}
      onClick={onClick}
    >
      {t('datePicker.clear')}
    </Button>
  );
}
