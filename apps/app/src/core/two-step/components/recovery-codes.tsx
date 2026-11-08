import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { useRefreshAccount } from '@/core/two-step/api/two-step.queries';

interface RecoveryCodesProps {
  codes: readonly string[];
  onDone: () => void;
}

// The recovery codes, which only now exist in readable form: the server keeps only their hashes.
export function RecoveryCodes({ codes, onDone }: RecoveryCodesProps) {
  const { t } = useTranslation();
  const refreshAccount = useRefreshAccount();

  return (
    <section className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h2 className="text-heading">{t('twoStep.recovery.title')}</h2>
        <p className="text-muted-foreground">{t('twoStep.recovery.intro')}</p>
      </div>
      <ul className="grid grid-cols-2 gap-x-4 gap-y-2 rounded-2xl bg-muted px-5 py-4 font-mono text-base tracking-wider tabular-nums sm:text-lg">
        {codes.map((code) => (
          <li key={code}>{code}</li>
        ))}
      </ul>
      <Button
        className="self-start"
        onClick={() => {
          onDone();
          void refreshAccount();
        }}
      >
        {t('twoStep.recovery.done')}
      </Button>
    </section>
  );
}
