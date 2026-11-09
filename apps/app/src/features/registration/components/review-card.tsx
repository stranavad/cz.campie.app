import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { DescriptionItem, DescriptionList } from '@/components/ui/description-list';

export interface ReviewRow {
  key: string;
  label: string;
  text: string;
}

interface ReviewCardProps {
  title: string;
  rows: readonly ReviewRow[];
  // Back to the step that asks these answers.
  onEdit: () => void;
}

// What the guardian answered on one step, read back, with the way to change it.
export function ReviewCard({ title, rows, onEdit }: ReviewCardProps) {
  const { t } = useTranslation('registration');

  return (
    <Card>
      <CardHeader className="items-center">
        <CardTitle>{title}</CardTitle>
        <Button type="button" variant="link" onClick={onEdit} aria-label={t('review.editOf', { section: title })}>
          {t('review.edit')}
        </Button>
      </CardHeader>
      <DescriptionList>
        {rows.map((row) => (
          <DescriptionItem key={row.key} label={row.label}>
            {row.text}
          </DescriptionItem>
        ))}
      </DescriptionList>
    </Card>
  );
}
