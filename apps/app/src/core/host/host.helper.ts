// The main host serves signup, the admin interface and the operator console; `app` is a reserved
// subdomain, so no Organisation can take it.
const MAIN_SUBDOMAIN = 'app';

export type Host =
  | { mode: 'platform' }
  | { mode: 'organisation'; subdomain: string }
  // Outside the platform domain, the bare domain itself, or nested subdomains.
  | { mode: 'unknown' };

export function resolveHost(hostname: string, platformDomain: string): Host {
  const suffix = `.${platformDomain}`;

  if (!hostname.endsWith(suffix)) {
    return { mode: 'unknown' };
  }

  const subdomain = hostname.slice(0, -suffix.length);

  if (subdomain === MAIN_SUBDOMAIN) {
    return { mode: 'platform' };
  }

  if (/^[a-z0-9-]+$/.test(subdomain)) {
    return { mode: 'organisation', subdomain };
  }

  return { mode: 'unknown' };
}
