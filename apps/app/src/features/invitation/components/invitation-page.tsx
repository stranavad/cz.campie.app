import { useTranslation } from 'react-i18next';

import { Card } from '@/components/ui/card';
import { InvitationContent } from '@/features/invitation/components/invitation-content';

interface InvitationPageProps {
  // From the emailed link; empty when the link carried none.
  token: string;
}

export function InvitationPage({ token }: InvitationPageProps) {
  const { t } = useTranslation('invitation');

  return (
    <div className="mx-auto flex w-full max-w-md flex-col py-4 sm:py-10">
      <Card className="gap-5 rounded-[28px] sm:p-7">
        <h1 className="text-card-title">{t('title')}</h1>
        <InvitationContent token={token} />
      </Card>
    </div>
  );
}
