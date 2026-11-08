import { Link, type LinkProps } from '@tanstack/react-router';
import { ChevronRightIcon, type LucideIcon } from 'lucide-react';

import { IconTile } from '@/components/icon-tile';

interface QuickLinkCardProps {
  to: LinkProps['to'];
  icon: LucideIcon;
  title: string;
  description: string;
}

// One area the admin may open: a whole tappable card.
export function QuickLinkCard({ to, icon: Icon, title, description }: QuickLinkCardProps) {
  return (
    <Link
      to={to}
      className="group flex min-h-20 w-full items-center gap-4 rounded-3xl border border-border bg-card p-4 transition-colors outline-none hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:p-5"
    >
      <IconTile tone="brand">
        <Icon />
      </IconTile>
      <span className="flex min-w-0 flex-1 flex-col leading-snug">
        <span className="font-bold">{title}</span>
        <span className="text-[13px] text-muted-foreground">{description}</span>
      </span>
      <ChevronRightIcon
        aria-hidden="true"
        className="size-5 shrink-0 text-subtle-foreground transition-transform group-hover:translate-x-0.5"
      />
    </Link>
  );
}
