import { useNavigate } from '@tanstack/react-router';

import type { CampSettingsSection } from '@/features/camps/components/camp-settings/camp-settings-section.constants';

export function useCampSwitcher(section: CampSettingsSection) {
  const navigate = useNavigate();

  return (campId: string) => void navigate({ to: '/platform/tabory', search: { tabor: campId, sekce: section } });
}
