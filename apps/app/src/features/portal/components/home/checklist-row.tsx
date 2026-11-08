import { Link } from '@tanstack/react-router';
import { ChevronRightIcon } from 'lucide-react';

import { IconTile } from '@/components/icon-tile';
import { CHECKLIST_ICONS } from '@/features/portal/components/home/checklist.constants';
import type { ChecklistEntry } from '@/features/portal/components/home/use-checklist-card.hook';

const rowClassName = 'flex items-center gap-3.5 rounded-3xl border border-border bg-card py-3.5 pr-3.5 pl-4';

// One open checklist item: a tappable row to where it is settled, or a plain one when it has no such place.
export function ChecklistRow({ entry, registrationId }: { entry: ChecklistEntry; registrationId: string }) {
  const Icon = CHECKLIST_ICONS[entry.item.kind];
  const content = (
    <>
      <IconTile tone={entry.tone}>
        <Icon />
      </IconTile>
      <span className="flex min-w-0 flex-1 flex-col leading-snug">
        <span className="font-bold">{entry.title}</span>
        {entry.meta === '' ? null : <span className="text-[13px] text-muted-foreground">{entry.meta}</span>}
      </span>
    </>
  );

  return entry.target === null ? (
    <li className={rowClassName}>{content}</li>
  ) : (
    <li>
      <Link
        to={entry.target}
        params={{ registrationId }}
        className={`${rowClassName} transition-colors hover:bg-muted`}
      >
        {content}
        <ChevronRightIcon aria-hidden="true" className="size-5 shrink-0 text-subtle-foreground" />
      </Link>
    </li>
  );
}
