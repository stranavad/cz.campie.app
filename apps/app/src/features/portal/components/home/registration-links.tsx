import { Link } from '@tanstack/react-router';
import { ChevronRightIcon, FileDownIcon, MailIcon, PhoneIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import type { GuardianRegistration } from '@repo/schema/portal';

const rowClassName =
  'flex min-h-13 items-center justify-between gap-3 px-5 font-semibold transition-colors hover:bg-muted [&>svg]:size-4.5 [&>svg]:shrink-0 [&>svg]:text-subtle-foreground';

interface RegistrationLinksProps {
  registration: GuardianRegistration;
}

// Where to go next for a Registration: its details, Consents and documents, each child's Přihláška, and the
// camp's contact.
export function RegistrationLinks({ registration }: RegistrationLinksProps) {
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
      <a href={`mailto:${registration.camp.contactEmail}`} className={rowClassName}>
        <span className="flex min-w-0 flex-col py-2 leading-snug">
          {t('writeCamp')}
          <span className="text-[13px] font-normal wrap-anywhere text-muted-foreground">
            {registration.camp.contactEmail}
          </span>
        </span>
        <MailIcon aria-hidden="true" />
      </a>
      {registration.camp.contactPhone === null ? null : (
        <a href={`tel:${registration.camp.contactPhone}`} className={rowClassName}>
          <span className="flex min-w-0 flex-col py-2 leading-snug">
            {t('callCamp')}
            <span className="text-[13px] font-normal text-muted-foreground">{registration.camp.contactPhone}</span>
          </span>
          <PhoneIcon aria-hidden="true" />
        </a>
      )}
    </nav>
  );
}
