import { ExternalLinkIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { QrCode } from '@/components/qr-code';
import { buttonVariants } from '@/components/ui/button';
import { groupSecret } from '@/core/two-step/helpers/group-secret.helper';

interface TotpSecretProps {
  // What to do with it: the first app, or the new phone's app.
  intro: string;
  secret: string;
  uri: string;
}

// A new TOTP secret three ways: the QR code to scan, the key to type in, the link that opens the app on
// this phone. The QR code sits beside the rest, above it on a narrow screen.
export function TotpSecret({ intro, secret, uri }: TotpSecretProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl bg-muted p-4 sm:flex-row sm:items-center sm:gap-5">
      <QrCode payload={uri} alt={t('twoStep.enrolment.qr')} />
      <div className="flex w-full min-w-0 flex-col gap-3">
        <p className="text-sm">{intro}</p>
        <code className="rounded-xl bg-card px-3 py-2 font-mono text-base tracking-wider break-all sm:text-lg">
          {groupSecret(secret)}
        </code>
        <a href={uri} className={buttonVariants({ variant: 'outline', className: 'self-start' })}>
          <ExternalLinkIcon aria-hidden="true" />
          {t('twoStep.enrolment.openApp')}
        </a>
      </div>
    </div>
  );
}
