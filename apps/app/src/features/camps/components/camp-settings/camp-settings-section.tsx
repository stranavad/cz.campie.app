import { useState } from 'react';

import type { CampSummary } from '@repo/schema/camps';

import { CampSettingsSectionContent } from '@/features/camps/components/camp-settings/camp-settings-section-content';
import type { CampSettingsSection as Section } from '@/features/camps/components/camp-settings/camp-settings-section.constants';

interface CampSettingsSectionProps {
  section: Section;
  organisationId: string;
  camp: CampSummary;
  canWrite: boolean;
}

// A tab's part mounts when it is first opened, so a tab loads just its own data, and stays mounted (hidden)
// after the admin moves on, so a half-edited form survives a look at another tab.
export function CampSettingsSection({ section, ...props }: CampSettingsSectionProps) {
  const [visited, setVisited] = useState<Section[]>([section]);

  if (!visited.includes(section)) {
    setVisited([...visited, section]);
  }

  return visited.map((visitedSection) => (
    <div key={visitedSection} hidden={visitedSection !== section} className="flex min-w-0 flex-col gap-6">
      <CampSettingsSectionContent section={visitedSection} {...props} />
    </div>
  ));
}
