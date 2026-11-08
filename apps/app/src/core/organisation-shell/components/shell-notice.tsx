import { EyeOffIcon, PauseIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { IconTile } from '@/components/icon-tile';

interface ShellNoticeProps {
  kind: 'suspended' | 'unknown';
}

// Instead of the pages: the Organisation is suspended, or not public yet.
export function ShellNotice({ kind }: ShellNoticeProps) {
  const { t } = useTranslation();

  return (
    <section className="my-8 flex flex-col items-center gap-3 rounded-3xl border border-border bg-card px-6 py-10 text-center">
      <IconTile tone={kind === 'suspended' ? 'warning' : 'neutral'} className="size-14 rounded-full">
        {kind === 'suspended' ? <PauseIcon /> : <EyeOffIcon />}
      </IconTile>
      <h1 className="text-heading">{t(`organisationShell.${kind}.title`)}</h1>
      <p className="max-w-md text-muted-foreground">{t(`organisationShell.${kind}.description`)}</p>
    </section>
  );
}
