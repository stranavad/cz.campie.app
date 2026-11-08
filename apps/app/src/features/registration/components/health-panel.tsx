import { LockIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

interface HealthPanelProps {
  children: ReactNode;
}

// A child's health answers in a muted panel, saying who will see them.
export function HealthPanel({ children }: HealthPanelProps) {
  const { t } = useTranslation('registration');

  return (
    <div className="flex flex-col gap-4 rounded-[20px] bg-muted p-4">
      <p className="flex items-start gap-2.5 leading-snug">
        <LockIcon aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
        <span className="flex flex-col">
          <span className="font-bold">{t('health.title')}</span>
          <span className="text-sm text-muted-foreground">{t('health.note')}</span>
        </span>
      </p>
      {children}
    </div>
  );
}
