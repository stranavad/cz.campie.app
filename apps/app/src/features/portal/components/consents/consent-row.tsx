import { CheckIcon, FileDownIcon, FileSignatureIcon, UndoIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import type { GuardianConsents } from '@repo/schema/consents';
import { czechDateTime } from '@repo/schema/shared';

import { IconTile } from '@/components/icon-tile';
import { Button, buttonVariants } from '@/components/ui/button';
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

// One Consent of a child: whether it is signed, the signed copy, and opening it to read and sign.
export function ConsentRow({ registrationId, participantId, consent, isOpen, onOpen }: ConsentRowProps) {
  const { t } = useTranslation('portal');
  const { tone, Icon } = TILES[consent.state];

  return (
    <Card className="gap-4">
      <div className="flex items-center gap-3">
        <IconTile tone={tone} className="rounded-full">
          <Icon />
        </IconTile>
        <span className="flex min-w-0 flex-1 flex-col leading-snug">
          <span className="font-bold">{consent.title}</span>
          <span className="text-[13px] text-muted-foreground">
            {consent.state === 'unsigned' || consent.signedAt === null
              ? t('consents.unsigned')
              : consent.state === 'withdrawn'
                ? t('consents.withdrawn')
                : t('consents.signedOn', { date: czechDateTime(consent.signedAt) })}
          </span>
        </span>
        {consent.signedPdf === null ? null : (
          <a
            href={consent.signedPdf.url}
            target="_blank"
            rel="noreferrer"
            aria-label={t('consents.signedPdf')}
            className={buttonVariants({ variant: 'ghost', size: 'icon' })}
          >
            <FileDownIcon aria-hidden="true" className="size-5" />
          </a>
        )}
      </div>
      {isOpen ? (
        <ConsentSignForm params={{ registrationId, participantId, consentId: consent.consentId }} />
      ) : consent.state === 'signed' ? (
        <Button type="button" variant="outline" className="self-start" onClick={onOpen}>
          {t('consents.open')}
        </Button>
      ) : (
        <Button type="button" variant="brand" size="lg" className="w-full" onClick={onOpen}>
          {t('consents.readAndSign')}
        </Button>
      )}
    </Card>
  );
}
