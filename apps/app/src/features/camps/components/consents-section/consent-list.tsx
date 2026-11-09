import { useTranslation } from 'react-i18next';

import type { ConsentSummary, StarterConsent } from '@repo/schema/consents';
import { czechDateTime } from '@repo/schema/shared';

import { Badge } from '@/components/ui/badge';
import { Meter } from '@/components/ui/meter';
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
        // The button stretches over the whole card; the meter sits beside it, as a button holds no meter.
        <div
          key={consent.id}
          className="relative flex flex-col gap-3 rounded-[22px] border border-border bg-card px-4.5 py-4 transition-colors hover:bg-muted has-aria-pressed:border-foreground has-aria-pressed:ring-1 has-aria-pressed:ring-foreground"
        >
          <button
            type="button"
            aria-pressed={openId === consent.id}
            className="flex cursor-pointer flex-col items-start gap-2 text-left after:absolute after:inset-0 after:rounded-[22px]"
            onClick={() => onOpen(consent.id)}
          >
            <span className="font-display text-lg leading-tight font-bold break-words">{consent.title}</span>
            <span className="text-[13px] text-muted-foreground">
              {t('consents.publishedVersionOf', { version: consent.version, date: czechDateTime(consent.publishedAt) })}
            </span>
            {consent.withdrawable ? <Badge variant="neutral">{t('consents.withdrawableShort')}</Badge> : null}
          </button>
          {consent.progress === null ? null : (
            <Meter
              label={t('consents.signedLabel')}
              value={consent.progress.signed}
              // A Camp without children yet shows an empty bar.
              max={Math.max(consent.progress.registered, 1)}
              valueLabel={t('consents.signedOf', {
                signed: consent.progress.signed,
                count: consent.progress.registered,
              })}
              className="text-sm"
            />
          )}
        </div>
      ))}
      {canWrite ? <ConsentStarterPicker onStartNew={onStartNew} /> : null}
    </div>
  );
}
