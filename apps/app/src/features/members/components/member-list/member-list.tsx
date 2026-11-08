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
    <section className="flex flex-col gap-3">
      <h2 className="text-heading px-1">{t('members.title')}</h2>
      <ul className="overflow-hidden rounded-3xl border border-border bg-card">
        {members.map((member) => (
          <MemberRow key={member.id} organisationId={organisationId} member={member} />
        ))}
      </ul>
    </section>
  );
}
