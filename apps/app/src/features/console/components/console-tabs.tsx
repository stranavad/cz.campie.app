import { Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

import { CountPill } from '@/components/count-pill';
import { TabNav, tabNavItemClassName } from '@/components/ui/tab-nav';
import {
  CONSOLE_SECTION_SLUGS,
  CONSOLE_SECTIONS,
  type ConsoleSection,
} from '@/features/console/components/console-section.constant';
import { cn } from '@/lib/utils';

interface ConsoleTabsProps {
  current: ConsoleSection;
  // What waits in each tab; none shows no count.
  counts: Record<ConsoleSection, number>;
}

// The console's sections as pills, each with what waits in it; the open one is in the address.
export function ConsoleTabs({ current, counts }: ConsoleTabsProps) {
  const { t } = useTranslation('console');

  return (
    <TabNav aria-label={t('tabs.label')}>
      {CONSOLE_SECTIONS.map((section) => (
        <Link
          key={section}
          to="/platform/konzole"
          search={{ sekce: CONSOLE_SECTION_SLUGS[section] }}
          aria-current={section === current ? 'page' : undefined}
          className={cn(tabNavItemClassName, 'gap-2')}
        >
          {t(`tabs.${section}`)}
          {counts[section] === 0 ? null : <CountPill count={counts[section]} tone="warning" />}
        </Link>
      ))}
    </TabNav>
  );
}
