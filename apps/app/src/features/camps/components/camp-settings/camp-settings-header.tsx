import { Link } from '@tanstack/react-router';
import { EyeIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import type { CampSummary } from '@repo/schema/camps';

import { PageHeader } from '@/components/page-header';
import { buttonVariants } from '@/components/ui/button';
import type { CampSettingsSection } from '@/features/camps/components/camp-settings/camp-settings-section.constants';
import { CampWindowBadge } from '@/features/camps/components/camp-settings/camp-window-badge';
import { CampSwitcher } from '@/features/camps/components/camp-switcher';

interface CampSettingsHeaderProps {
  organisationId: string;
  camps: readonly CampSummary[];
  selected: CampSummary;
  section: CampSettingsSection;
  canWrite: boolean;
  isCreating: boolean;
  onCreate: () => void;
}

// The Camp being set up, its window state and its public page. Another Camp, or a new one, is picked in the
// switcher above the title, so nothing competes with the page's own actions. Each tab saves its own parts.
export function CampSettingsHeader({
  organisationId,
  camps,
  selected,
  section,
  canWrite,
  isCreating,
  onCreate,
}: CampSettingsHeaderProps) {
  const { t } = useTranslation('camps');
  const canCreate = canWrite && !isCreating;

  return (
    <PageHeader
      eyebrow={
        camps.length > 1 || canCreate ? (
          <CampSwitcher
            camps={camps}
            selectedId={selected.id}
            section={section}
            onCreate={canCreate ? onCreate : undefined}
          />
        ) : (
          <span className="text-sm font-semibold text-muted-foreground">{t('switcher')}</span>
        )
      }
      title={selected.name}
      status={<CampWindowBadge organisationId={organisationId} campId={selected.id} />}
      description={canWrite ? undefined : t('readOnly')}
      actions={
        <Link
          to="/platform/tabory/nahled"
          search={{ tabor: selected.id }}
          className={buttonVariants({ variant: 'outline' })}
        >
          <EyeIcon aria-hidden="true" />
          {t('settings.preview')}
        </Link>
      }
    />
  );
}
