import { FileDownIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import type { GuardianDocuments } from '@repo/schema/documents';
import { czechDate } from '@repo/schema/shared';

import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { REQUIREMENT_STATUS_BADGES } from '@/features/portal/components/documents/requirement-status.constants';
import { statusOf } from '@/features/portal/components/documents/requirement-status.helper';
import { RequirementUploads } from '@/features/portal/components/documents/requirement-uploads';

interface RequirementCardProps {
  registrationId: string;
  requirement: GuardianDocuments['requirements'][number];
  // The child it is shown for; none when the Registration has no child to hand it in for.
  participant: GuardianDocuments['participants'][number] | undefined;
}

// A document the child still has to hand in, in full: what it is, by when, its blank form, why it came back,
// and handing it in.
export function RequirementCard({ registrationId, requirement, participant }: RequirementCardProps) {
  const { t } = useTranslation('portal');
  const uploads = participant?.uploads[requirement.id] ?? [];
  const status = statusOf(uploads);

  return (
    <Card className="gap-3.5 px-4.5 py-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col leading-snug">
          <h2 className="text-heading">{requirement.name}</h2>
          {requirement.dueDate === null ? null : (
            <span className="text-sm text-muted-foreground">
              {t('documents.dueBy', { date: czechDate(requirement.dueDate) })}
            </span>
          )}
        </div>
        {participant === undefined ? null : (
          <Badge variant={REQUIREMENT_STATUS_BADGES[status]} className="h-6.5 text-xs font-bold">
            {t(`documents.statuses.${status}`)}
          </Badge>
        )}
      </div>
      {requirement.description === '' ? null : (
        <p className="text-sm whitespace-pre-line text-muted-foreground">{requirement.description}</p>
      )}
      {requirement.blankForm === null ? null : (
        <a
          href={requirement.blankForm.url}
          target="_blank"
          rel="noreferrer"
          className={buttonVariants({ variant: 'link', className: 'min-h-11 self-start text-sm' })}
        >
          <FileDownIcon aria-hidden="true" />
          {t('documents.blankForm')}
        </a>
      )}
      {participant === undefined ? null : (
        <RequirementUploads
          registrationId={registrationId}
          participantId={participant.id}
          documentTypeId={requirement.id}
          uploads={uploads}
        />
      )}
    </Card>
  );
}
