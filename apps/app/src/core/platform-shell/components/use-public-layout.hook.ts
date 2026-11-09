import { useMatchRoute } from '@tanstack/react-router';

import { LEGAL_PAGES } from '@/core/platform-shell/components/legal-pages.constant';

// What the public header offers on the open page: the login beside signup, the other texts beside a legal one.
export function usePublicLayout() {
  const matchRoute = useMatchRoute();

  return {
    isSignup: matchRoute({ to: '/platform/registrace-organizace' }) !== false,
    isLegal: LEGAL_PAGES.some(({ to }) => matchRoute({ to }) !== false),
  };
}
