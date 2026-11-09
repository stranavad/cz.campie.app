import { useTranslation } from 'react-i18next';

import { PERMISSION_AREAS, type Member } from '@repo/schema/admins';

import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { MemberTableRow } from '@/features/members/components/member-table/member-table-row';

interface MemberTableProps {
  organisationId: string;
  members: Member[];
}

// Every member with their level in each permission area and their two-step login; scrolls sideways inside
// its card on a phone.
export function MemberTable({ organisationId, members }: MemberTableProps) {
  const { t } = useTranslation('members');

  return (
    <Table className="min-w-[60rem]" aria-label={t('members.title')}>
      <TableHeader>
        <TableRow>
          <TableHead>{t('members.member')}</TableHead>
          {PERMISSION_AREAS.map((area) => (
            <TableHead key={area}>{t(`areas.${area}`)}</TableHead>
          ))}
          <TableHead>{t('members.totp')}</TableHead>
          <TableHead>
            <span className="sr-only">{t('members.actions')}</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {members.map((member) => (
          <MemberTableRow key={member.id} organisationId={organisationId} member={member} />
        ))}
      </TableBody>
    </Table>
  );
}
