import { CircleAlertIcon, CircleCheckIcon, Trash2Icon } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useEraseRegistrationMutation } from '@/features/participants/api/participants.queries';

interface EraseRegistrationProps {
  organisationId: string;
  registrationId: string;
}

// The Owner's erasure of a Registration to an accounting tombstone: typed confirmation, then gone for good.
export function EraseRegistration({ organisationId, registrationId }: EraseRegistrationProps) {
  const { t } = useTranslation('participants');
  const erase = useEraseRegistrationMutation(organisationId, registrationId);
  const [isOpen, setOpen] = useState(false);
  const [confirmation, setConfirmation] = useState('');
  const word = t('erase.word');

  return (
    <Card className="border-danger-foreground/40">
      <CardTitle>{t('erase.title')}</CardTitle>
      <CardDescription>{t('erase.intro')}</CardDescription>
      {isOpen ? (
        <div className="flex flex-col gap-3 text-sm">
          <label className="flex flex-col gap-1.5 font-semibold">
            {t('erase.confirm', { word })}
            <Input value={confirmation} onChange={(event) => setConfirmation(event.target.value)} />
          </label>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="destructive"
              disabled={confirmation.trim().toUpperCase() !== word.toUpperCase() || erase.isPending}
              onClick={() => erase.mutate(undefined)}
            >
              {t('erase.do')}
            </Button>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              {t('erase.cancel')}
            </Button>
          </div>
        </div>
      ) : (
        <Button type="button" variant="outline" className="self-start" onClick={() => setOpen(true)}>
          <Trash2Icon aria-hidden="true" />
          {t('erase.open')}
        </Button>
      )}
      {erase.isSuccess ? (
        <Alert variant="success">
          <CircleCheckIcon aria-hidden="true" />
          <output>{t('erase.done')}</output>
        </Alert>
      ) : null}
      {erase.isError ? (
        <Alert variant="danger" role="alert">
          <CircleAlertIcon aria-hidden="true" />
          {t('erase.failed')}
        </Alert>
      ) : null}
    </Card>
  );
}
