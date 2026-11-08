import { useTranslation } from 'react-i18next';

import type { CampSummary } from '@repo/schema/camps';

import { Select } from '@/components/ui/select';
import type { CampSettingsSection } from '@/features/camps/components/camp-settings/camp-settings-section.constants';
import { useCampSwitcher } from '@/features/camps/components/use-camp-switcher.hook';

interface CampSwitcherProps {
  camps: readonly CampSummary[];
  selectedId: string;
  // The open tab, kept when switching Camps.
  section: CampSettingsSection;
}

// Shown only with several Camps: a quiet "switch" link that opens the list of Camps. The chosen Camp goes
// into the address, so a reload keeps it.
export function CampSwitcher({ camps, selectedId, section }: CampSwitcherProps) {
  const { t } = useTranslation('camps');
  const switchTo = useCampSwitcher(section);

  return (
    <Select
      variant="bare"
      aria-label={t('switcher')}
      value={selectedId}
      onValueChange={switchTo}
      options={camps.map((camp) => ({ value: camp.id, label: camp.name }))}
    >
      {t('settings.switch')}
    </Select>
  );
}
