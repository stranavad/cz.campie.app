import { ChevronDownIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import type { GuardianDocuments } from '@repo/schema/documents';
import { czechDate, czechDateTime } from '@repo/schema/shared';

import { Badge } from '@/components/ui/badge';
import { REQUIREMENT_STATUS_BADGES } from '@/features/portal/components/documents/requirement-status.constants';
import { statusOf } from '@/features/portal/components/documents/requirement-status.helper';
import { RequirementUploads } from '@/features/portal/components/documents/requirement-uploads';

interface RequirementRowProps {
  registrationId: string;
  requirement: GuardianDocuments['requirements'][number];
  participant: GuardianDocuments['participants'][number];
}

// A document already handed in, as a compact row: its state, and folded under it what was handed in and,
// while it waits for review, swapping it for another.
export function RequirementRow({ registrationId, requirement, participant }: RequirementRowProps) {
  const { t } = useTranslation('portal');
  const uploads = participant.uploads[requirement.id] ?? [];
  const status = statusOf(uploads);
  const newest = uploads.at(0);

  return (
    <li>
      <details className="group rounded-3xl border border-border bg-card">
        <summary className="flex min-h-11 cursor-pointer list-none items-center gap-3 rounded-3xl px-4.5 py-4 [&::-webkit-details-marker]:hidden">
          <span className="flex min-w-0 flex-1 flex-col leading-snug">
            <span className="font-bold">{requirement.name}</span>
            <span className="text-[13px] text-muted-foreground">
              {newest === undefined
                ? requirement.dueDate === null
                  ? null
                  : t('documents.dueBy', { date: czechDate(requirement.dueDate) })
                : t('documents.handedIn', { date: czechDateTime(newest.uploadedAt) })}
            </span>
          </span>
          <Badge variant={REQUIREMENT_STATUS_BADGES[status]} className="h-6.5 text-xs font-bold">
            {t(`documents.statuses.${status}`)}
          </Badge>
          <ChevronDownIcon
            aria-hidden="true"
            className="size-4 shrink-0 text-subtle-foreground transition-transform group-open:rotate-180"
          />
        </summary>
        <div className="px-4.5 pb-4">
          <RequirementUploads
            registrationId={registrationId}
            participantId={participant.id}
            documentTypeId={requirement.id}
            uploads={uploads}
          />
        </div>
      </details>
    </li>
  );
}
