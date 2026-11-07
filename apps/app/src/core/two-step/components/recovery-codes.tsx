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
    <section className="flex max-w-xl flex-col gap-4">
      <h2 className="text-xl font-semibold">{t('twoStep.recovery.title')}</h2>
      <p className="text-muted-foreground">{t('twoStep.recovery.intro')}</p>
      <ul className="grid grid-cols-2 gap-2 self-start rounded bg-muted px-4 py-3 font-mono text-lg">
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
