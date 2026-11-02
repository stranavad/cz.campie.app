import { useTranslation } from 'react-i18next';

import type { Member } from '@repo/schema/admins';

import { MemberRow } from '@/features/members/components/member-list/member-row';

interface MemberListProps {
  organisationId: string;
  members: Member[];
}

export function MemberList({ organisationId, members }: MemberListProps) {
  const { t } = useTranslation('members');

  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-lg font-semibold">{t('members.title')}</h2>
      <ul>
        {members.map((member) => (
          <MemberRow key={member.id} organisationId={organisationId} member={member} />
        ))}
      </ul>
    </section>
  );
}
