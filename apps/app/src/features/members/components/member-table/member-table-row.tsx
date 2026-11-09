import { useTranslation } from 'react-i18next';

import { PERMISSION_AREAS, type Member } from '@repo/schema/admins';

import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { TableCell, TableRow } from '@/components/ui/table';
import { LevelChip } from '@/features/members/components/member-table/level-chip';
import { MemberEditDialog } from '@/features/members/components/member-table/member-edit-dialog';
import { cn } from '@/lib/utils';

interface MemberTableRowProps {
  organisationId: string;
  member: Member;
}

// One member: who, their level in each area (an Owner holds changes in all), two-step login, and the edit.
export function MemberTableRow({ organisationId, member }: MemberTableRowProps) {
  const { t } = useTranslation('members');

  return (
    <TableRow>
      <TableCell className="py-3.5">
        <span className="flex items-center gap-3">
          <Avatar name={member.email} />
          <span className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
            <span className="font-semibold break-all">{member.email}</span>
            {member.owner ? (
              <Badge variant="brand" className="h-5.5 px-2 text-xs font-bold">
                {t('members.owner')}
              </Badge>
            ) : null}
          </span>
        </span>
      </TableCell>
      {PERMISSION_AREAS.map((area) => (
        <TableCell key={area}>
          <LevelChip level={member.owner ? 'write' : member.permissions[area]} />
        </TableCell>
      ))}
      <TableCell
        className={cn('font-medium', member.totpEnabled ? 'text-success-foreground' : 'text-danger-foreground')}
      >
        {member.totpEnabled ? t('members.totpOn') : t('members.totpOff')}
      </TableCell>
      <TableCell className="text-right">
        <MemberEditDialog organisationId={organisationId} member={member} />
      </TableCell>
    </TableRow>
  );
}
