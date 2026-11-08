import { Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

import { useAdminNav } from '@/core/platform-shell/components/use-admin-nav.hook';

// Pill links; the current page's is tinted with the accent.
export function AdminNav() {
  const { t } = useTranslation();
  const items = useAdminNav();

  return (
    <nav aria-label={t('platformShell.nav.label')} className="flex flex-col gap-0.5">
      {items.map((item) => (
        <Link
          key={item.to}
          to={item.to}
          activeOptions={{ exact: item.exact }}
          className="group flex h-11 items-center gap-3 rounded-full px-3.5 font-medium text-nav-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground data-[status=active]:bg-brand-soft data-[status=active]:font-bold data-[status=active]:text-foreground"
        >
          <item.icon
            aria-hidden="true"
            className="size-[18px] shrink-0 group-data-[status=active]:text-brand-soft-foreground"
          />
          {t(`platformShell.nav.${item.label}`)}
        </Link>
      ))}
    </nav>
  );
}
