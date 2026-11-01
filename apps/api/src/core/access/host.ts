import type { Request } from 'express';

// The subdomain of the main host; reserved, so no Organisation can take it.
const MAIN_SUBDOMAIN = 'app';

export type Host =
  | { readonly kind: 'main' }
  | { readonly kind: 'organisation'; readonly subdomain: string }
  // Outside the platform domain, the bare domain itself, or nested subdomains.
  | { readonly kind: 'unknown' };

/**
 * Read the host the browser called. Behind the frontend's proxy the request reaches the API under another
 * host, so the forwarded host wins; without a proxy (locally, in tests) it is the Host header.
 * @param request the request
 */
export function originalHost(request: Request): string {
  // Proxies append to what they receive, so only the last entry is our proxy's; earlier ones came from
  // the client and prove nothing.
  const forwarded = request.get('x-forwarded-host')?.split(',').at(-1)?.trim();

  return forwarded !== undefined && forwarded !== '' ? forwarded : (request.get('host') ?? '');
}

/**
 * Tell which part of the platform a host belongs to.
 * @param host a host, possibly with a port
 * @param platformDomain the configured platform domain
 */
export function parseHost(host: string, platformDomain: string): Host {
  const hostname = host.replace(/:\d+$/, '').toLowerCase();
  const suffix = `.${platformDomain}`;

  if (!hostname.endsWith(suffix)) {
    return { kind: 'unknown' };
  }

  const subdomain = hostname.slice(0, -suffix.length);

  if (subdomain === MAIN_SUBDOMAIN) {
    return { kind: 'main' };
  }

  return /^[a-z0-9-]+$/.test(subdomain) ? { kind: 'organisation', subdomain } : { kind: 'unknown' };
}
