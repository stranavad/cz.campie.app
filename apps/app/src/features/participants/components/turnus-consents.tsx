import { Link } from '@tanstack/react-router';
import { CircleAlertIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Alert } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useTurnusConsentsQuery } from '@/features/participants/api/participants.queries';
import { ConsentStateBadge } from '@/features/participants/components/consent-state-badge';

interface TurnusConsentsProps {
  organisationId: string;
  turnusId: string;
}

// The Turnus's children against the Camp's Consents.
export function TurnusConsents({ organisationId, turnusId }: TurnusConsentsProps) {
  const { t } = useTranslation('participants');
  const matrix = useTurnusConsentsQuery(organisationId, turnusId, true);

  if (matrix.isError) {
    return (
      <Alert variant="danger" role="alert">
        <CircleAlertIcon aria-hidden="true" />
        {t('error')}
      </Alert>
    );
  }

  if (matrix.data === undefined) {
    return <Skeleton className="h-40" />;
  }

  if (matrix.data.consents.length === 0) {
    return <p className="text-sm text-muted-foreground">{t('consents.noConsents')}</p>;
  }

  return (
    <Table containerClassName="rounded-2xl">
      <TableHeader>
        <TableRow>
          <TableHead>{t('consents.child')}</TableHead>
          {matrix.data.consents.map((consent) => (
            <TableHead key={consent.id}>{consent.title}</TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {matrix.data.participants.map((participant) => (
          <TableRow key={participant.id} className="content-auto">
            <TableCell className="font-semibold whitespace-nowrap">
              <Link
                to="/platform/prihlasky/$registrationId"
                params={{ registrationId: participant.registrationId }}
                className="underline-offset-4 hover:underline"
              >
                {t('name', { first: participant.firstName, last: participant.lastName })}
              </Link>
            </TableCell>
            {matrix.data.consents.map((consent) => (
              <TableCell key={consent.id}>
                <ConsentStateBadge state={participant.states[consent.id] ?? 'unsigned'} />
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
