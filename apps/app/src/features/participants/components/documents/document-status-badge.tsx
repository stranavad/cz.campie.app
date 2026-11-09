import { useTranslation } from 'react-i18next';

import type { AdminUpload } from '@repo/schema/documents';

import { Badge } from '@/components/ui/badge';

const VARIANT = { missing: 'danger', pending: 'warning', approved: 'success', returned: 'danger' } as const;

interface DocumentStatusBadgeProps {
  status: AdminUpload['status'] | 'missing';
}

// Where a required document stands, as a pill.
export function DocumentStatusBadge({ status }: DocumentStatusBadgeProps) {
  const { t } = useTranslation('participants');

  return <Badge variant={VARIANT[status]}>{t(`documents.statuses.${status}`)}</Badge>;
}
