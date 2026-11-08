import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';

export interface TurnusRemovalProps {
  isConfirming: boolean;
  isRemoving: boolean;
  onAsk: () => void;
  onConfirm: () => void;
  onCancel: () => void;
}

// Removing a Turnus asks once more before it happens.
export function TurnusRemoval({ isConfirming, isRemoving, onAsk, onConfirm, onCancel }: TurnusRemovalProps) {
  const { t } = useTranslation('camps');

  if (!isConfirming) {
    return (
      <Button type="button" variant="ghost" className="text-danger-foreground" onClick={onAsk}>
        {t('turnus.remove')}
      </Button>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button type="button" variant="destructive" disabled={isRemoving} onClick={onConfirm}>
        {t('turnus.confirmRemove')}
      </Button>
      <Button type="button" variant="ghost" onClick={onCancel}>
        {t('turnus.keep')}
      </Button>
    </div>
  );
}
