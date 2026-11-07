import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import {
  usePaymentReminderPreviewQuery,
  useSendRemindersMutation,
} from '@/features/participants/api/participants.queries';
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
  const [isOpen, setOpen] = useState(false);
  const [overdueOnly, setOverdueOnly] = useState(false);
  const preview = usePaymentReminderPreviewQuery(organisationId, turnusId, isOpen);
  const send = useSendRemindersMutation(organisationId, turnusId);
  const count = overdueOnly ? preview.data?.overdue : preview.data?.withBalance;
  const refusal = send.error instanceof HttpError ? readErrorResponse(send.error.details)?.code : undefined;

  if (!isOpen) {
    return (
      <Button type="button" size="sm" variant="outline" className="self-start" onClick={() => setOpen(true)}>
        {t('reminders.open')}
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-2 rounded-lg border p-3 text-sm sm:max-w-md">
      {preview.data?.enabled === false ? <p>{t('reminders.switchedOff')}</p> : null}
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={overdueOnly}
          onChange={(event) => {
            send.reset();
            setOverdueOnly(event.target.checked);
          }}
        />
        {t('reminders.overdueOnly')}
      </label>
      {count === undefined ? null : <p>{t('reminders.count', { count })}</p>}
      {send.data === undefined ? (
        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            disabled={count === undefined || count === 0 || preview.data?.enabled !== true || send.isPending}
            onClick={() => send.mutate(overdueOnly)}
          >
            {t('reminders.send')}
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={() => setOpen(false)}>
            {t('reminders.close')}
          </Button>
        </div>
      ) : (
        <output>{t('reminders.sent', { count: send.data.reminded })}</output>
      )}
      {send.isError ? (
        <p role="alert" className="text-destructive">
          {refusal === 'payment_reminder_switched_off'
            ? t('reminders.switchedOff')
            : refusal === 'requests_throttled'
              ? t('reminders.throttled')
              : t('reminders.failed')}
        </p>
      ) : null}
    </div>
  );
}
