import { Link } from '@tanstack/react-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { useTurnusConsentsQuery } from '@/features/participants/api/participants.queries';

interface TurnusConsentsProps {
  organisationId: string;
  turnusId: string;
}

// The Turnus's children against the Camp's Consents, shown on request.
export function TurnusConsents({ organisationId, turnusId }: TurnusConsentsProps) {
  const { t } = useTranslation('participants');
  const [isOpen, setOpen] = useState(false);
  const matrix = useTurnusConsentsQuery(organisationId, turnusId, isOpen);

  if (!isOpen) {
    return (
      <Button type="button" size="sm" variant="outline" className="self-start" onClick={() => setOpen(true)}>
        {t('consents.matrix')}
      </Button>
    );
  }

  if (matrix.data === undefined) {
    return matrix.isError ? <p className="text-sm text-destructive">{t('error')}</p> : null;
  }

  if (matrix.data.consents.length === 0) {
    return <p className="text-sm text-muted-foreground">{t('consents.noConsents')}</p>;
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left">
            <th className="p-2 font-medium">{t('consents.child')}</th>
            {matrix.data.consents.map((consent) => (
              <th key={consent.id} className="p-2 font-medium">
                {consent.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {matrix.data.participants.map((participant) => (
            <tr key={participant.id} className="border-b last:border-0">
              <td className="p-2">
                <Link
                  to="/platform/prihlasky/$registrationId"
                  params={{ registrationId: participant.registrationId }}
                  className="underline"
                >
                  {t('name', { first: participant.firstName, last: participant.lastName })}
                </Link>
              </td>
              {matrix.data.consents.map((consent) => {
                const state = participant.states[consent.id] ?? 'unsigned';

                return (
                  <td key={consent.id} className={`p-2 ${state === 'signed' ? '' : 'text-destructive'}`}>
                    {t(`consents.states.${state}`)}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
