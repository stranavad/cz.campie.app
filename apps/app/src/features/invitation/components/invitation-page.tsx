import { useTranslation } from 'react-i18next';

import { InvitationContent } from '@/features/invitation/components/invitation-content';

interface InvitationPageProps {
  // From the emailed link; empty when the link carried none.
  token: string;
}

export function InvitationPage({ token }: InvitationPageProps) {
  const { t } = useTranslation('invitation');

  return (
    <section className="flex max-w-sm flex-col gap-6 py-12">
      <h1 className="text-2xl font-semibold">{t('title')}</h1>
      <InvitationContent token={token} />
    </section>
  );
}
