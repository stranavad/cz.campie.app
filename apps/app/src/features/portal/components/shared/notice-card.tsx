import type { ReactNode } from 'react';

import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface NoticeCardProps {
  icon: ReactNode;
  // `brand` for something to do next, `success` for something done.
  tone: 'brand' | 'success';
  title: ReactNode;
  children?: ReactNode;
}

// A card telling the guardian how something ended: a round icon, a title and what to do next.
export function NoticeCard({ icon, tone, title, children }: NoticeCardProps) {
  return (
    <Card className="gap-2.5">
      <span
        aria-hidden="true"
        className={cn(
          'flex size-13 items-center justify-center rounded-full [&>svg]:size-6',
          tone === 'brand' ? 'bg-brand-soft text-brand-soft-foreground' : 'bg-success text-success-foreground',
        )}
      >
        {icon}
      </span>
      <output className="block font-display text-[22px] leading-tight font-bold">{title}</output>
      {children}
    </Card>
  );
}
