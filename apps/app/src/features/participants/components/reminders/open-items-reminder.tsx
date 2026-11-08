import { useTranslation } from 'react-i18next';

import {
  useOpenItemsPreviewQuery,
  useSendOpenItemsReminderMutation,
} from '@/features/participants/api/participants.queries';
import { ReminderTile } from '@/features/participants/components/reminders/reminder-tile';
import { HttpError } from '@/lib/api';
import { readErrorResponse } from '@/lib/api/error-response.helper';

interface OpenItemsReminderProps {
  organisationId: string;
  turnusId: string;
}

// Reminding every guardian with something open besides payment: the count first, then a confirming click.
export function OpenItemsReminder({ organisationId, turnusId }: OpenItemsReminderProps) {
  const { t } = useTranslation('participants');
  const preview = useOpenItemsPreviewQuery(organisationId, turnusId, true);
  const send = useSendOpenItemsReminderMutation(organisationId, turnusId);
  const refusal = send.error instanceof HttpError ? readErrorResponse(send.error.details)?.code : undefined;
  const count = preview.data?.registrations;

  return (
    <ReminderTile
      title={t('openItems.open')}
      switchedOff={preview.data?.enabled === false ? t('openItems.switchedOff') : null}
      count={count}
      canSend={count !== undefined && count !== 0 && preview.data?.enabled === true && !send.isPending}
      onSend={() => send.mutate()}
      sent={send.data?.reminded}
      failure={
        !send.isError
          ? null
          : refusal === 'open_items_reminder_switched_off'
            ? t('openItems.switchedOff')
            : refusal === 'requests_throttled'
              ? t('reminders.throttled')
              : t('reminders.failed')
      }
    >
      <p className="text-muted-foreground">{t('openItems.intro')}</p>
    </ReminderTile>
  );
}
