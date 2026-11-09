import { Card } from '@/components/ui/card';
import { InvitationContent } from '@/features/invitation/components/invitation-content';

interface InvitationPageProps {
  // From the emailed link; empty when the link carried none.
  token: string;
}

export function InvitationPage({ token }: InvitationPageProps) {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col py-4 sm:py-10">
      <Card className="gap-4 rounded-[28px] sm:p-7">
        <InvitationContent token={token} />
      </Card>
    </div>
  );
}
