import { Navigate, useLocation } from '@tanstack/react-router';

// Sends a signed-out admin to the login, which brings them back here.
export function LoginRedirect() {
  // The address as the browser shows it, without the host mode prefix the router adds to its own location.
  const address = useLocation({ select: (location) => location.publicHref });

  return <Navigate to="/platform/prihlaseni" search={{ zpet: address === '/' ? undefined : address }} replace />;
}
