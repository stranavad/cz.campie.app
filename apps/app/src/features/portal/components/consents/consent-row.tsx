import { CheckIcon, FileSignatureIcon, UndoIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import type { GuardianConsents } from '@repo/schema/consents';
import { czechDateTime } from '@repo/schema/shared';

import { IconTile } from '@/components/icon-tile';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ConsentSignForm } from '@/features/portal/components/consents/consent-sign-form';

interface ConsentRowProps {
  registrationId: string;
  participantId: string;
  consent: GuardianConsents['participants'][number]['consents'][number];
  isOpen: boolean;
  onOpen: () => void;
}

const TILES = {
  signed: { tone: 'success', Icon: CheckIcon },
  unsigned: { tone: 'warning', Icon: FileSignatureIcon },
  withdrawn: { tone: 'neutral', Icon: UndoIcon },
} as const;

// One Consent of a child: open, to read and sign; otherwise a row with its state and the signed copy, opened
// by its title.
export function ConsentRow({ registrationId, participantId, consent, isOpen, onOpen }: ConsentRowProps) {
  const { t } = useTranslation('portal');
  const { tone, Icon } = TILES[consent.state];
  // Signed before, but the camp has changed it since: the new version waits for a signature.
  const newVersion =
    consent.state === 'unsigned' && consent.signedVersion !== null ? (
      <Badge variant="warning" className="h-6.5 text-xs font-bold">
        {t('consents.newVersion')}
      </Badge>
    ) : null;

  if (isOpen) {
    return (
      <Card className="gap-3.5 px-4.5 py-5">
        <div className="flex items-start justify-between gap-2">
          <h2 className="text-heading break-words">{consent.title}</h2>
          {newVersion}
        </div>
        <ConsentSignForm params={{ registrationId, participantId, consentId: consent.consentId }} />
      </Card>
    );
  }

  return (
    <Card className="relative gap-3 px-4.5 py-4">
      <div className="flex items-center gap-3">
        <IconTile tone={tone} className="size-10 rounded-full [&>svg]:size-5">
          <Icon />
        </IconTile>
        <div className="flex min-h-11 min-w-0 flex-1 flex-col justify-center leading-snug">
          <h2 className="font-sans text-base font-bold tracking-normal">
            {/* Its area covers the whole row, so the row opens on a tap anywhere outside its links. */}
            <button
              type="button"
              aria-expanded={false}
              onClick={onOpen}
              className="cursor-pointer text-left outline-none after:absolute after:inset-0 after:rounded-3xl focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-ring"
            >
              {consent.title}
            </button>
          </h2>
          <span className="text-[13px] text-muted-foreground">
            {consent.state === 'unsigned' || consent.signedAt === null
              ? t('consents.unsigned')
              : consent.state === 'withdrawn'
                ? t('consents.withdrawn')
                : t('consents.signedOn', { date: czechDateTime(consent.signedAt) })}
          </span>
        </div>
        {newVersion}
        {consent.signedPdf === null ? null : (
          <a
            href={consent.signedPdf.url}
            target="_blank"
            rel="noreferrer"
            aria-label={t('consents.signedPdf')}
            className="relative flex min-h-11 items-center px-3 text-sm font-bold underline-offset-4 hover:underline"
          >
            {t('consents.pdf')}
          </a>
        )}
      </div>
      {consent.state === 'unsigned' ? (
        <Button type="button" variant="brand" size="lg" className="relative w-full" onClick={onOpen}>
          {t('consents.readAndSign')}
        </Button>
      ) : null}
    </Card>
  );
}
