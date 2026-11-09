import { CheckIcon, XIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import type { RegistrationDetail } from '@repo/schema/registrations';

import { Card, CardTitle } from '@/components/ui/card';

interface DeclarationsCardProps {
  declarations: RegistrationDetail['declarations'];
}

// The declarations as the guardian answered them.
export function DeclarationsCard({ declarations }: DeclarationsCardProps) {
  const { t } = useTranslation('participants');

  if (declarations.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardTitle>{t('detail.declarations')}</CardTitle>
      <ul className="flex flex-col gap-3 text-sm">
        {declarations.map((declaration, index) => (
          <li key={index} className="flex gap-3">
            {declaration.accepted ? (
              <CheckIcon aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-success-foreground" />
            ) : (
              <XIcon aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-danger-foreground" />
            )}
            <span>
              {t(declaration.accepted ? 'detail.accepted' : 'detail.notAccepted', { text: declaration.text })}
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
