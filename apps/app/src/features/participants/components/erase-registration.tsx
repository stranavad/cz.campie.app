import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
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
    <section className="flex flex-col gap-2 rounded-lg border border-destructive/40 p-3 text-sm">
      <h2 className="font-semibold">{t('erase.title')}</h2>
      <p className="text-muted-foreground">{t('erase.intro')}</p>
      {isOpen ? (
        <div className="flex flex-wrap items-end gap-2">
          <label className="flex flex-col gap-1">
            {t('erase.confirm', { word })}
            <input
              className="h-9 rounded-lg border border-input bg-transparent px-2"
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
            />
          </label>
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
      ) : (
        <Button type="button" variant="outline" className="self-start" onClick={() => setOpen(true)}>
          {t('erase.open')}
        </Button>
      )}
      {erase.isSuccess ? <output>{t('erase.done')}</output> : null}
      {erase.isError ? <p className="text-destructive">{t('erase.failed')}</p> : null}
    </section>
  );
}
