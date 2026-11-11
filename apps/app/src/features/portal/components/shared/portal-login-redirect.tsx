import { Navigate, useLocation } from '@tanstack/react-router';
import { useEffect } from 'react';

import { rememberPortalReturn } from '@/features/portal/components/shared/portal-return.helper';

// Sends a signed-out guardian to the portal login, which brings them back here after the emailed link.
export function PortalLoginRedirect() {
  // The address as the browser shows it, without the host mode prefix the router adds to its own location.
  const address = useLocation({ select: (location) => location.publicHref });

  useEffect(() => {
    if (address !== '/portal') {
      rememberPortalReturn(address);
    }
  }, [address]);

  return <Navigate to="/organisation/portal/prihlaseni" replace />;
}
