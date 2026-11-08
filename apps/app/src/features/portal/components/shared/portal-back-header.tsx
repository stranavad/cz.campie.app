import { Link } from '@tanstack/react-router';
import { ChevronLeftIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { BackHeader } from '@/components/back-header';

interface PortalBackHeaderProps {
  title: ReactNode;
  subtitle?: ReactNode;
}

// The top of an inner portal screen, with the way back to the guardian's Registrations; its title is the
// screen's main heading.
export function PortalBackHeader({ title, subtitle }: PortalBackHeaderProps) {
  const { t } = useTranslation('portal');

  return (
    <BackHeader
      back={(className) => (
        <Link to="/organisation/portal" aria-label={t('edit.back')} className={className}>
          <ChevronLeftIcon aria-hidden="true" />
        </Link>
      )}
      title={title}
      isHeading
      subtitle={subtitle}
    />
  );
}
