import { Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

import { buttonVariants } from '@/components/ui/button';
import type { useWaitingList } from '@/features/admin-home/components/use-waiting-list.hook';
import { cn } from '@/lib/utils';

interface WaitingRowProps {
  item: ReturnType<typeof useWaitingList>['items'][number];
}

const TONE = { danger: 'bg-danger text-danger-foreground', neutral: 'bg-muted text-nav-foreground' } as const;

// One open item: its count, what it is, and a link to the list where it is dealt with.
export function WaitingRow({ item }: WaitingRowProps) {
  const { t } = useTranslation('adminHome');
  const title = t(`waiting.${item.key}.title`);
  const detail =
    item.date !== null
      ? t('waiting.overdue.detail', { date: item.date })
      : item.families !== null
        ? t('waiting.families', { count: item.families })
        : null;

  return (
    <li className="flex flex-wrap items-center gap-x-3.5 gap-y-2 px-4 py-3.5">
      <span
        className={cn(
          'flex h-10 min-w-10 shrink-0 items-center justify-center rounded-[14px] px-2.5 font-display text-lg font-bold tabular-nums',
          TONE[item.tone],
        )}
      >
        {item.count}
      </span>
      <span className="flex min-w-0 flex-[1_1_10rem] flex-col leading-snug">
        <span className="font-semibold">{title}</span>
        {detail === null ? null : <span className="text-[13px] text-muted-foreground">{detail}</span>}
      </span>
      <Link
        to="/platform/prihlasky"
        search={item.search}
        className={buttonVariants({ variant: 'outline', size: 'sm' })}
      >
        {t(`waiting.action.${item.action}`)}
        <span className="sr-only">{t('waiting.actionOf', { item: title })}</span>
      </Link>
    </li>
  );
}
