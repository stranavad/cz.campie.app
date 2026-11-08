import { CircleAlertIcon, CircleCheckIcon, InfoIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

interface ReminderTileProps {
  title: string;
  // Why nothing would go out, when the Camp has the reminder switched off.
  switchedOff: string | null;
  // How many Registrations the reminder goes to, once known.
  count: number | undefined;
  canSend: boolean;
  onSend: () => void;
  // How many were reminded, once sent.
  sent: number | undefined;
  failure: string | null;
  // The reminder's own options or explanation.
  children: ReactNode;
}

// One kind of reminder: what it does, how many it goes to, and the button that sends it.
export function ReminderTile(props: ReminderTileProps) {
  const { t } = useTranslation('participants');

  return (
    <div className="flex flex-col gap-3 rounded-[20px] bg-muted p-4 text-sm">
      <p className="text-[15px] font-semibold">{props.title}</p>
      {props.children}
      {props.switchedOff === null ? null : (
        <Alert variant="warning">
          <InfoIcon aria-hidden="true" />
          {props.switchedOff}
        </Alert>
      )}
      {props.count === undefined ? null : <p>{t('reminders.count', { count: props.count })}</p>}
      {props.sent === undefined ? (
        <Button type="button" size="sm" className="self-start" disabled={!props.canSend} onClick={props.onSend}>
          {t('reminders.send')}
        </Button>
      ) : (
        <Alert variant="success">
          <CircleCheckIcon aria-hidden="true" />
          <output>{t('reminders.sent', { count: props.sent })}</output>
        </Alert>
      )}
      {props.failure === null ? null : (
        <Alert variant="danger" role="alert">
          <CircleAlertIcon aria-hidden="true" />
          {props.failure}
        </Alert>
      )}
    </div>
  );
}
