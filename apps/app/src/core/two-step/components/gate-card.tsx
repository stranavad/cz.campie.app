import type { ReactNode } from 'react';

import { IconTile } from '@/components/icon-tile';
import { Card } from '@/components/ui/card';

interface GateCardProps {
  icon: ReactNode;
  children: ReactNode;
}

// A step the admin passes before any admin page: a card centred in the main column.
export function GateCard({ icon, children }: GateCardProps) {
  return (
    <Card className="mx-auto w-full max-w-lg gap-5 sm:mt-6 sm:p-8">
      <IconTile tone="brand">{icon}</IconTile>
      {children}
    </Card>
  );
}
