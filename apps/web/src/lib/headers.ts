import { site } from '../content/site.ts';
import type { SiteEnv } from './site-env.ts';

const TURNSTILE_ORIGIN = 'https://challenges.cloudflare.com';

// The only scripts are this site's own modules (src/scripts/ and the chunks they load), the speculation
// rules, Turnstile on /kontakt and, in production, Umami, which also posts its events to its own origin.
// JSON-LD is a data block, which script-src does not govern. No worker-src: no worker is ever started.
function contentSecurityPolicy(env: SiteEnv): string {
  const analytics = env === 'production' ? ` ${site.umami.origin}` : '';
  return [
    "default-src 'self'",
    `script-src 'self' 'inline-speculation-rules' ${TURNSTILE_ORIGIN}${analytics}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    "font-src 'self'",
    `connect-src 'self'${analytics}`,
    `frame-src ${TURNSTILE_ORIGIN}`,
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
  ].join('; ');
}

// Cloudflare's _headers file for the static assets. HSTS leaves out includeSubDomains on purpose: the
// platform's subdomains are served elsewhere and decide for themselves.
export function buildHeaders(env: SiteEnv): string {
  const all = [
    'Strict-Transport-Security: max-age=31536000',
    'X-Content-Type-Options: nosniff',
    'Referrer-Policy: strict-origin-when-cross-origin',
    'Permissions-Policy: camera=(), microphone=(), geolocation=(), interest-cohort=()',
    `Content-Security-Policy: ${contentSecurityPolicy(env)}`,
    ...(env === 'production' ? [] : ['X-Robots-Tag: noindex, nofollow']),
  ];
  const rules: [string, string[]][] = [
    ['/*', all],
    ['/_astro/*', ['Cache-Control: public, max-age=31536000, immutable']],
    // The Markdown twins are for llms.txt readers, not search results.
    ['/*.md', ['X-Robots-Tag: noindex']],
  ];
  return rules.map(([path, headers]) => [path, ...headers.map((header) => `  ${header}`)].join('\n')).join('\n') + '\n';
}

export function buildRobots(env: SiteEnv): string {
  if (env !== 'production') {
    return 'User-agent: *\nDisallow: /\n';
  }
  return `User-agent: *\nAllow: /\n\nSitemap: ${site.url}/sitemap-index.xml\n`;
}

// RFC 9116; it expires a year after the build.
export function buildSecurityTxt(builtAt: Date): string {
  const expires = new Date(builtAt);
  expires.setUTCFullYear(expires.getUTCFullYear() + 1);
  return [
    `Contact: mailto:${site.email}`,
    `Expires: ${expires.toISOString()}`,
    'Preferred-Languages: cs, en',
    `Canonical: ${site.url}/.well-known/security.txt`,
    '',
  ].join('\n');
}
