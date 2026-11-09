import { useTranslation } from 'react-i18next';

import type { ParticipantRow } from '@repo/schema/registrations';

import { Badge } from '@/components/ui/badge';
import { hasUnsignedConsent } from '@/core/participant-list';

interface ParticipantIssuesProps {
  row: ParticipantRow;
}

// What the child still lacks, as pills; nothing when nothing does.
export function ParticipantIssues({ row }: ParticipantIssuesProps) {
  const { t } = useTranslation('participants');
  const issues = [
    { shown: hasUnsignedConsent(row.consents), key: 'consent', variant: 'danger', label: t('filters.unsignedConsent') },
    { shown: row.documents === 'missing', key: 'document', variant: 'danger', label: t('filters.missingDocument') },
    { shown: row.documents === 'to_review', key: 'review', variant: 'warning', label: t('row.documentToReview') },
    { shown: row.missingAnswers, key: 'answers', variant: 'warning', label: t('filters.missingAnswers') },
    { shown: row.unverifiedClaimedDiscount, key: 'discount', variant: 'warning', label: t('filters.unverified') },
    { shown: row.emailUndeliverable, key: 'email', variant: 'danger', label: t('emailUndeliverable') },
  ] as const;
  const shown = issues.filter((issue) => issue.shown);

  if (shown.length === 0) {
    return null;
  }

  return (
    <span className="flex flex-wrap gap-1.5">
      {shown.map((issue) => (
        <Badge key={issue.key} variant={issue.variant}>
          {issue.label}
        </Badge>
      ))}
    </span>
  );
}
