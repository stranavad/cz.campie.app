import { Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

import { TabNav, tabNavItemClassName } from '@/components/ui/tab-nav';
import {
  CAMP_SETTINGS_SECTIONS,
  type CampSettingsSection,
} from '@/features/camps/components/camp-settings/camp-settings-section.constant';

interface CampSettingsTabsProps {
  campId: string;
  section: CampSettingsSection;
}

// One tab per part of the Camp's settings; each is a link, so a reload or a shared address keeps the tab.
export function CampSettingsTabs({ campId, section }: CampSettingsTabsProps) {
  const { t } = useTranslation('camps');

  return (
    <TabNav aria-label={t('settings.nav')}>
      {CAMP_SETTINGS_SECTIONS.map((tab) => (
        <Link
          key={tab}
          to="/platform/tabory"
          search={{ tabor: campId, sekce: tab }}
          aria-current={tab === section ? 'page' : undefined}
          className={tabNavItemClassName}
        >
          {t(`settings.tabs.${tab}`)}
        </Link>
      ))}
    </TabNav>
  );
}
