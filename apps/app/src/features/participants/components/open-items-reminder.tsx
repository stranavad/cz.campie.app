import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import {
  useOpenItemsPreviewQuery,
  useSendOpenItemsReminderMutation,
} from '@/features/participants/api/participants.queries';
import { HttpError } from '@/lib/api';
import { readErrorResponse } from '@/lib/api/error-response.helper';

interface OpenItemsReminderProps {
  organisationId: string;
  turnusId: string;
}

// Reminding every guardian with something open besides payment: the count first, then a confirming click.
export function OpenItemsReminder({ organisationId, turnusId }: OpenItemsReminderProps) {
  const { t } = useTranslation('participants');
  const [isOpen, setOpen] = useState(false);
  const preview = useOpenItemsPreviewQuery(organisationId, turnusId, isOpen);
  const send = useSendOpenItemsReminderMutation(organisationId, turnusId);
  const refusal = send.error instanceof HttpError ? readErrorResponse(send.error.details)?.code : undefined;
  const count = preview.data?.registrations;

  if (!isOpen) {
    return (
      <Button type="button" size="sm" variant="outline" className="self-start" onClick={() => setOpen(true)}>
        {t('openItems.open')}
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-2 rounded-lg border p-3 text-sm sm:max-w-md">
      <p className="text-muted-foreground">{t('openItems.intro')}</p>
      {preview.data?.enabled === false ? <p>{t('openItems.switchedOff')}</p> : null}
      {count === undefined ? null : <p>{t('reminders.count', { count })}</p>}
      {send.data === undefined ? (
        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            disabled={count === undefined || count === 0 || preview.data?.enabled !== true || send.isPending}
            onClick={() => send.mutate()}
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
          {refusal === 'open_items_reminder_switched_off'
            ? t('openItems.switchedOff')
            : refusal === 'requests_throttled'
              ? t('reminders.throttled')
              : t('reminders.failed')}
        </p>
      ) : null}
    </div>
  );
}
