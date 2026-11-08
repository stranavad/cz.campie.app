import { Link } from '@tanstack/react-router';
import { ChevronLeftIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

// The way back to the list, naming the Turnus when it is known.
export function BackToList({ turnus }: { turnus?: string }) {
  const { t } = useTranslation('participants');

  return (
    <Link
      to="/platform/prihlasky"
      className="inline-flex min-h-8 items-center gap-1 self-start rounded-md text-sm font-semibold text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
    >
      <ChevronLeftIcon aria-hidden="true" className="size-4" />
      {turnus === undefined ? t('title') : t('detail.back', { turnus })}
    </Link>
  );
}
