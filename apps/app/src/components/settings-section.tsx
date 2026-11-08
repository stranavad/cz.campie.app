import type { ReactNode } from 'react';

import { Card } from '@/components/ui/card';

interface SettingsSectionProps {
  title: string;
  description?: string;
  children: ReactNode;
}

// A settings card: its name and purpose above the fields on a phone, in a column beside them on a laptop.
export function SettingsSection({ title, description, children }: SettingsSectionProps) {
  return (
    <Card className="lg:grid lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-10">
      <div className="flex flex-col gap-1">
        <h2 className="text-heading">{title}</h2>
        {description === undefined ? null : <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      <div className="flex min-w-0 flex-col gap-5">{children}</div>
    </Card>
  );
}
