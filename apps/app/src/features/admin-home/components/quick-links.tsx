import { useTranslation } from 'react-i18next';

import { QuickLinkCard } from '@/features/admin-home/components/quick-link-card';
import type { useAdminHome } from '@/features/admin-home/components/use-admin-home.hook';

interface QuickLinksProps {
  links: ReturnType<typeof useAdminHome>['links'];
}

// The areas the admin may open, as a grid of cards: one column on a phone, up to three on a laptop.
export function QuickLinks({ links }: QuickLinksProps) {
  const { t } = useTranslation('adminHome');

  if (links.length === 0) {
    return null;
  }

  return (
    <nav aria-label={t('links.label')}>
      <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {links.map((link) => (
          <li key={link.to} className="flex">
            <QuickLinkCard
              to={link.to}
              icon={link.icon}
              title={t(`links.${link.name}.title`)}
              description={t(`links.${link.name}.description`)}
            />
          </li>
        ))}
      </ul>
    </nav>
  );
}
