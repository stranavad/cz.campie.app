import { useTranslation } from 'react-i18next';

import type { ConsentSummary, StarterConsent } from '@repo/schema/consents';
import { czechDateTime } from '@repo/schema/shared';

import { Badge } from '@/components/ui/badge';
import { ConsentStarterPicker } from '@/features/camps/components/consents-section/consent-starter-picker';

interface ConsentListProps {
  consents: readonly ConsentSummary[];
  // null: a new Consent; undefined: none opened.
  openId: string | null | undefined;
  canWrite: boolean;
  onOpen: (consentId: string) => void;
  onStartNew: (from: StarterConsent | null) => void;
}

// The Camp's Consents as cards to open, and where a new one starts.
export function ConsentList({ consents, openId, canWrite, onOpen, onStartNew }: ConsentListProps) {
  const { t } = useTranslation('camps');

  return (
    <div className="flex min-w-0 flex-col gap-3">
      {consents.map((consent) => (
        <button
          key={consent.id}
          type="button"
          aria-pressed={openId === consent.id}
          className="flex cursor-pointer flex-col items-start gap-2 rounded-[22px] border border-border bg-card px-4.5 py-4 text-left transition-colors hover:bg-muted aria-pressed:border-foreground aria-pressed:ring-1 aria-pressed:ring-foreground"
          onClick={() => onOpen(consent.id)}
        >
          <span className="font-display text-lg leading-tight font-bold break-words">{consent.title}</span>
          <span className="text-[13px] text-muted-foreground">
            {t('consents.versionOf', { version: consent.version, date: czechDateTime(consent.publishedAt) })}
          </span>
          {consent.withdrawable ? <Badge variant="neutral">{t('consents.withdrawableShort')}</Badge> : null}
        </button>
      ))}
      {canWrite ? <ConsentStarterPicker onStartNew={onStartNew} /> : null}
    </div>
  );
}
