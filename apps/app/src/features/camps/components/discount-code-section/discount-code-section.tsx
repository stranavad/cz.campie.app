import { PlusIcon } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { DiscountCodeForm } from '@/features/camps/components/discount-code-section/discount-code-form';
import { DiscountCodeTable } from '@/features/camps/components/discount-code-section/discount-code-table';
import { useDiscountCodeSection } from '@/features/camps/components/discount-code-section/use-discount-code-section.hook';

interface DiscountCodeSectionProps {
  organisationId: string;
  campId: string;
  canWrite: boolean;
}

// A Camp's Discount codes with their uses and status; codes are switched off, never deleted.
export function DiscountCodeSection({ organisationId, campId, canWrite }: DiscountCodeSectionProps) {
  const { t } = useTranslation('camps');
  const section = useDiscountCodeSection(organisationId, campId);
  const [isCreating, setCreating] = useState(false);
  const codes = section.codes.data ?? [];

  return (
    <Card className="gap-0 overflow-hidden p-0 sm:p-0">
      <CardHeader className="items-center px-5 pt-5 pb-4 sm:px-6">
        <CardTitle>{t('discountCodes.title')}</CardTitle>
        {canWrite && !isCreating ? (
          <Button type="button" onClick={() => setCreating(true)}>
            <PlusIcon aria-hidden="true" />
            {t('discountCodes.create')}
          </Button>
        ) : null}
      </CardHeader>
      {canWrite && isCreating ? (
        <div className="px-5 pb-5 sm:px-6">
          <DiscountCodeForm organisationId={organisationId} campId={campId} onClose={() => setCreating(false)} />
        </div>
      ) : null}
      {section.codes.isPending ? <p className="px-5 pb-5 text-muted-foreground sm:px-6">{t('loading')}</p> : null}
      {section.codes.isError ? <p className="px-5 pb-5 text-destructive sm:px-6">{t('error')}</p> : null}
      {section.codes.data?.length === 0 ? (
        <p className="px-5 pb-5 text-muted-foreground sm:px-6">{t('discountCodes.empty')}</p>
      ) : null}
      {codes.length === 0 ? null : (
        <DiscountCodeTable
          codes={codes}
          canWrite={canWrite}
          isUpdating={section.isUpdating}
          onToggle={section.toggle}
          onRemove={section.remove}
        />
      )}
      {section.updateFailed ? (
        <div className="px-5 pb-5 sm:px-6">
          <Alert variant="danger" role="alert">
            {t('failure')}
          </Alert>
        </div>
      ) : null}
    </Card>
  );
}
