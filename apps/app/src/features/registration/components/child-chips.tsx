import { PlusIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import type { Answers } from '@repo/schema/form-engine';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ChildChipsProps {
  participants: readonly Answers[];
  active: number;
  onSelect: (index: number) => void;
  // The children with something wrong shown, outlined so the guardian finds them (not marked invalid, so
  // the focus goes to the field itself).
  invalid: readonly number[];
  onAdd: (() => void) | null;
}

// The children of the Registration as chips, one filled in at a time, and a sibling to add.
export function ChildChips({ participants, active, onSelect, invalid, onAdd }: ChildChipsProps) {
  const { t } = useTranslation('registration');

  return (
    <div className="flex flex-wrap gap-2">
      {participants.map((answers, index) => {
        const name = typeof answers.firstName === 'string' ? answers.firstName.trim() : '';

        return (
          <Button
            key={index}
            type="button"
            variant={index === active ? 'default' : 'outline'}
            aria-pressed={index === active}
            onClick={() => onSelect(index)}
            className={cn('max-w-full', invalid.includes(index) && 'border-2 border-danger-foreground')}
          >
            <span className="truncate">{name === '' ? t('child', { number: index + 1 }) : name}</span>
            {invalid.includes(index) ? <span className="sr-only">{t('childToFix')}</span> : null}
          </Button>
        );
      })}
      {onAdd === null ? null : (
        <Button type="button" variant="dashed" onClick={onAdd}>
          <PlusIcon aria-hidden="true" />
          {t('addSibling')}
        </Button>
      )}
    </div>
  );
}
