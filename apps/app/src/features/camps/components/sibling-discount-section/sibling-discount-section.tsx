import { useTranslation } from 'react-i18next';

import { Alert } from '@/components/ui/alert';
import { useCampQuery } from '@/features/camps/api/camps.queries';
import { SiblingDiscountForm } from '@/features/camps/components/sibling-discount-section/sibling-discount-form';

interface SiblingDiscountSectionProps {
  organisationId: string;
  campId: string;
  canWrite: boolean;
}

// The Camp's Sibling discount, above its Discount codes.
export function SiblingDiscountSection({ organisationId, campId, canWrite }: SiblingDiscountSectionProps) {
  const { t } = useTranslation('camps');
  const camp = useCampQuery(organisationId, campId);

  if (camp.isPending) {
    return <p className="text-muted-foreground">{t('loading')}</p>;
  }

  if (camp.isError) {
    return <Alert variant="danger">{t('error')}</Alert>;
  }

  return <SiblingDiscountForm organisationId={organisationId} camp={camp.data} canWrite={canWrite} />;
}
