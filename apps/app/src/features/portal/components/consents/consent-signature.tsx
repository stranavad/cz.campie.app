import { FileDownIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import type { GuardianConsent } from '@repo/schema/consents';
import { czechDateTime } from '@repo/schema/shared';

import { buttonVariants } from '@/components/ui/button';

interface ConsentSignatureProps {
  signature: NonNullable<GuardianConsent['signature']>;
}

// Who signed this Consent and when, whether it was withdrawn, and the signed copy.
export function ConsentSignature({ signature }: ConsentSignatureProps) {
  const { t } = useTranslation('portal');

  return (
    <div className="flex flex-col gap-2 rounded-2xl bg-muted px-4 py-3 text-sm">
      <p>{t('consents.signedAt', { name: signature.signerName, date: czechDateTime(signature.signedAt) })}</p>
      {signature.withdrawnAt === null ? null : (
        <p className="font-semibold">{t('consents.withdrawnAt', { date: czechDateTime(signature.withdrawnAt) })}</p>
      )}
      {signature.signedPdf === null ? null : (
        <a
          href={signature.signedPdf.url}
          target="_blank"
          rel="noreferrer"
          className={buttonVariants({ variant: 'link', className: 'self-start' })}
        >
          <FileDownIcon aria-hidden="true" />
          {t('consents.signedPdf')}
        </a>
      )}
    </div>
  );
}
