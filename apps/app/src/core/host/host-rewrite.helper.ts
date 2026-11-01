import type { LocationRewrite } from '@tanstack/react-router';

import type { Host } from '@/core/host/host.helper';

// Each host mode has its own branch of the route tree (`routes/organisation/`, `routes/platform/`,
// `routes/unknown/`). The router sees every URL prefixed with the current mode and the browser never
// sees the prefix, so both modes can own `/` and routes of one mode are unreachable from the other.
export function hostRewrite(mode: Host['mode']): LocationRewrite {
  const prefix = `/${mode}`;

  return {
    input: ({ url }) => {
      url.pathname = `${prefix}${url.pathname}`;
      return url;
    },
    output: ({ url }) => {
      if (url.pathname === prefix || url.pathname.startsWith(`${prefix}/`)) {
        url.pathname = url.pathname.slice(prefix.length) || '/';
      }
      return url;
    },
  };
}
