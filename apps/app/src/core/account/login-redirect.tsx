import { Navigate, useLocation } from '@tanstack/react-router';
import { useState } from 'react';

// Sends a signed-out admin to the login, which brings them back here.
export function LoginRedirect() {
  // The address as the browser shows it, without the host mode prefix the router adds to its own location.
  const current = useLocation({ select: (location) => location.publicHref });
  // The address asked for, kept from the first render: the redirect itself changes the location.
  const [address] = useState(current);

  return <Navigate to="/platform/prihlaseni" search={{ zpet: address === '/' ? undefined : address }} replace />;
}
