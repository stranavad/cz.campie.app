import { XIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { ParticipantExport } from '@/features/participants/components/export/participant-export';
import type { ParticipantsPanel } from '@/features/participants/components/participants-search.constant';
import { OpenItemsReminder } from '@/features/participants/components/reminders/open-items-reminder';
import { PaymentReminders } from '@/features/participants/components/reminders/payment-reminders';
import { TurnusConsents } from '@/features/participants/components/turnus-consents';

interface ParticipantsPanelCardProps {
  panel: ParticipantsPanel;
  organisationId: string;
  turnusId: string;
  campId: string | null;
  onClose: () => void;
}

// The tool opened from the header: reminders, exports or the Consents of the whole Turnus.
export function ParticipantsPanelCard({
  panel,
  organisationId,
  turnusId,
  campId,
  onClose,
}: ParticipantsPanelCardProps) {
  const { t } = useTranslation('participants');

  return (
    <Card>
      <CardHeader className="items-center">
        <CardTitle>{t(`panel.${panel}`)}</CardTitle>
        <Button type="button" variant="ghost" size="icon" aria-label={t('reminders.close')} onClick={onClose}>
          <XIcon aria-hidden="true" />
        </Button>
      </CardHeader>
      {panel === 'reminders' ? (
        <div className="grid gap-3 md:grid-cols-2">
          <PaymentReminders organisationId={organisationId} turnusId={turnusId} />
          <OpenItemsReminder organisationId={organisationId} turnusId={turnusId} />
        </div>
      ) : null}
      {panel === 'export' ? (
        <ParticipantExport organisationId={organisationId} turnusId={turnusId} campId={campId} />
      ) : null}
      {panel === 'consents' ? <TurnusConsents organisationId={organisationId} turnusId={turnusId} /> : null}
    </Card>
  );
}
