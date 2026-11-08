import { Link } from '@tanstack/react-router';
import { ChevronRightIcon, FileDownIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import type { GuardianRegistration } from '@repo/schema/portal';

const rowClassName =
  'flex min-h-13 items-center justify-between gap-3 px-5 font-semibold transition-colors hover:bg-muted [&>svg]:size-4.5 [&>svg]:shrink-0 [&>svg]:text-subtle-foreground';

// Where to go next for a Registration: its details, Consents and documents, and each child's Přihláška.
export function RegistrationLinks({ registration }: { registration: GuardianRegistration }) {
  const { t } = useTranslation('portal');
  const params = { registrationId: registration.id };
  const prihlasky = registration.participants.filter((participant) => participant.prihlaska !== null);

  return (
    <nav
      aria-label={t('links')}
      className="flex flex-col divide-y divide-border-subtle overflow-hidden rounded-3xl border border-border bg-card"
    >
      <Link to="/organisation/portal/$registrationId" params={params} className={rowClassName}>
        {t('edit.open')}
        <ChevronRightIcon aria-hidden="true" />
      </Link>
      {registration.camp.consents ? (
        <Link to="/organisation/portal/$registrationId/souhlasy" params={params} className={rowClassName}>
          {t('consents.link')}
          <ChevronRightIcon aria-hidden="true" />
        </Link>
      ) : null}
      {registration.camp.documents ? (
        <Link to="/organisation/portal/$registrationId/dokumenty" params={params} className={rowClassName}>
          {t('documents.link')}
          <ChevronRightIcon aria-hidden="true" />
        </Link>
      ) : null}
      {prihlasky.map((participant) =>
        participant.prihlaska === null ? null : (
          <a
            key={participant.id}
            href={participant.prihlaska.url}
            target="_blank"
            rel="noreferrer"
            className={rowClassName}
          >
            {prihlasky.length === 1 && registration.participants.length === 1
              ? t('prihlaska')
              : t('prihlaskaOf', { participant: participant.firstName })}
            <FileDownIcon aria-hidden="true" />
          </a>
        ),
      )}
    </nav>
  );
}
