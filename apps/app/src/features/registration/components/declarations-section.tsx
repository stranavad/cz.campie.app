import { useTranslation } from 'react-i18next';

import type { ShownDeclaration } from '@repo/schema/camps';

import { Card, CardTitle } from '@/components/ui/card';
import { FieldError } from '@/components/ui/field';
import { DeclarationCheckbox } from '@/core/registration-form';

interface DeclarationsSectionProps {
  declarations: readonly ShownDeclaration[];
  ticked: readonly string[];
  onTick: (id: string, checked: boolean) => void;
  // A mandatory one is left unticked, told once the guardian asks to send.
  isMissing: boolean;
}

// The declarations the guardian ticks, each with its document.
export function DeclarationsSection({ declarations, ticked, onTick, isMissing }: DeclarationsSectionProps) {
  const { t } = useTranslation('registration');

  if (declarations.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardTitle>{t('declarations')}</CardTitle>
      <div className="flex flex-col gap-2">
        {declarations.map((declaration) => (
          <DeclarationCheckbox
            key={declaration.id}
            declaration={declaration}
            checked={ticked.includes(declaration.id)}
            onChange={(checked) => onTick(declaration.id, checked)}
          />
        ))}
      </div>
      {isMissing ? <FieldError>{t('declarationsMissing')}</FieldError> : null}
    </Card>
  );
}
