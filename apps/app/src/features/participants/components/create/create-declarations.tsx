import { useTranslation } from 'react-i18next';

import type { TurnusForm } from '@repo/schema/registrations';

import { Card, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';

interface CreateDeclarationsProps {
  declarations: TurnusForm['declarations'];
  ticked: readonly string[];
  onTick: (id: string, on: boolean) => void;
}

// The declarations as the guardian ticked them on paper.
export function CreateDeclarations({ declarations, ticked, onTick }: CreateDeclarationsProps) {
  const { t } = useTranslation('participants');

  if (declarations.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardTitle>{t('detail.declarations')}</CardTitle>
      <div className="flex flex-col gap-1">
        {declarations.map((declaration) => (
          <label key={declaration.id} className="flex min-h-11 cursor-pointer items-start gap-3 py-1.5 text-sm">
            <Checkbox
              className="mt-0.5"
              checked={ticked.includes(declaration.id)}
              onCheckedChange={(checked) => onTick(declaration.id, checked)}
            />
            {declaration.text}
          </label>
        ))}
      </div>
    </Card>
  );
}
