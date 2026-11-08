import { FileDownIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import type { RegistrationConsents } from '@repo/schema/consents';
import { czechDateTime } from '@repo/schema/shared';

import { Button } from '@/components/ui/button';
import { ConsentStateBadge } from '@/features/participants/components/consent-state-badge';

interface ConsentItemProps {
  consent: RegistrationConsents['participants'][number]['consents'][number];
  onOpenPdf: (signatureId: string) => void;
  isOpening: boolean;
}

// One Consent of a child: its state, the items declined and each signature with its PDF.
export function ConsentItem({ consent, onOpenPdf, isOpening }: ConsentItemProps) {
  const { t } = useTranslation('participants');

  return (
    <li className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-semibold">{consent.title}</span>
        <ConsentStateBadge state={consent.state} />
      </div>
      {consent.declinedItems.length === 0 ? null : (
        <p className="text-danger-foreground">{t('consents.declined', { items: consent.declinedItems.join('; ') })}</p>
      )}
      {consent.signatures.map((signature) => (
        <div
          key={signature.id}
          className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-muted-foreground"
        >
          <span>
            {t('consents.signature', {
              version: signature.version,
              name: signature.signerName,
              date: czechDateTime(signature.signedAt),
            })}
          </span>
          {signature.superseded ? <span>{t('consents.superseded')}</span> : null}
          {signature.withdrawnAt === null ? null : (
            <span>{t('consents.withdrawnAt', { date: czechDateTime(signature.withdrawnAt) })}</span>
          )}
          {signature.hasPdf ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={isOpening}
              onClick={() => onOpenPdf(signature.id)}
            >
              <FileDownIcon aria-hidden="true" />
              {t('consents.pdf')}
            </Button>
          ) : null}
        </div>
      ))}
    </li>
  );
}
