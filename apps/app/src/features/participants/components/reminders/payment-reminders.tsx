import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Checkbox } from '@/components/ui/checkbox';
import {
  usePaymentReminderPreviewQuery,
  useSendRemindersMutation,
} from '@/features/participants/api/participants.queries';
import { ReminderTile } from '@/features/participants/components/reminders/reminder-tile';
import { HttpError } from '@/lib/api';
import { readErrorResponse } from '@/lib/api/error-response.helper';

interface PaymentRemindersProps {
  organisationId: string;
  turnusId: string;
}

// Reminding every guardian with something to pay, or only the Overdue ones: the count first, then a
// confirming click.
export function PaymentReminders({ organisationId, turnusId }: PaymentRemindersProps) {
  const { t } = useTranslation('participants');
  const [overdueOnly, setOverdueOnly] = useState(false);
  const preview = usePaymentReminderPreviewQuery(organisationId, turnusId, true);
  const send = useSendRemindersMutation(organisationId, turnusId);
  const count = overdueOnly ? preview.data?.overdue : preview.data?.withBalance;
  const refusal = send.error instanceof HttpError ? readErrorResponse(send.error.details)?.code : undefined;

  return (
    <ReminderTile
      title={t('reminders.open')}
      switchedOff={preview.data?.enabled === false ? t('reminders.switchedOff') : null}
      count={count}
      canSend={count !== undefined && count !== 0 && preview.data?.enabled === true && !send.isPending}
      onSend={() => send.mutate(overdueOnly)}
      sent={send.data?.reminded}
      failure={
        !send.isError
          ? null
          : refusal === 'payment_reminder_switched_off'
            ? t('reminders.switchedOff')
            : refusal === 'requests_throttled'
              ? t('reminders.throttled')
              : t('reminders.failed')
      }
    >
      <label className="flex min-h-11 cursor-pointer items-center gap-3">
        <Checkbox
          checked={overdueOnly}
          onCheckedChange={(checked) => {
            send.reset();
            setOverdueOnly(checked);
          }}
        />
        {t('reminders.overdueOnly')}
      </label>
    </ReminderTile>
  );
}
