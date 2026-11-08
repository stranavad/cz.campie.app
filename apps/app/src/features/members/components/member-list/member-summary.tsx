import { ChevronDownIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import type { Member } from '@repo/schema/admins';

import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { PermissionBadges } from '@/features/members/components/member-list/permission-badges';

interface MemberSummaryProps {
  member: Member;
}

// The always-visible line of a member: who, their role and access, and the toggle that opens the edits.
export function MemberSummary({ member }: MemberSummaryProps) {
  const { t } = useTranslation('members');

  return (
    <summary className="flex min-h-11 cursor-pointer list-none items-center gap-3 px-5 py-4 transition-colors hover:bg-muted/50 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring sm:px-6 [&::-webkit-details-marker]:hidden">
      <Avatar name={member.email} />
      <span className="flex min-w-0 flex-1 flex-col gap-2">
        <span className="flex min-w-0 flex-wrap items-center gap-2">
          <span className="min-w-0 truncate font-semibold">{member.email}</span>
          {member.owner ? <Badge variant="brand">{t('members.owner')}</Badge> : null}
        </span>
        <span className="flex flex-wrap gap-1.5">
          {member.owner ? null : <PermissionBadges permissions={member.permissions} />}
          <Badge variant={member.totpEnabled ? 'success' : 'danger'} dot>
            {member.totpEnabled ? t('members.totpOn') : t('members.totpOff')}
          </Badge>
        </span>
      </span>
      <span className="flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-control px-3 text-sm font-semibold">
        <span className="sr-only sm:not-sr-only">{t('members.edit')}</span>
        <ChevronDownIcon aria-hidden="true" className="size-4 transition-transform group-open:rotate-180" />
      </span>
    </summary>
  );
}
