import { useTranslation } from 'react-i18next';

import type { GuardianEdit } from '@repo/schema/portal';

import { Card, CardTitle } from '@/components/ui/card';
import { DescriptionItem, DescriptionList } from '@/components/ui/description-list';

// Answers to questions the form no longer asks, to read only.
export function RemovedAnswers({ removed }: { removed: GuardianEdit['removed'] }) {
  const { t } = useTranslation('portal');

  if (removed.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardTitle>{t('edit.removed')}</CardTitle>
      <DescriptionList>
        {removed.map((answer, index) => (
          <DescriptionItem key={index} label={answer.label}>
            {typeof answer.value === 'boolean'
              ? t(answer.value ? 'edit.yes' : 'edit.no')
              : Array.isArray(answer.value)
                ? answer.value.join(', ')
                : String(answer.value ?? '')}
          </DescriptionItem>
        ))}
      </DescriptionList>
    </Card>
  );
}
