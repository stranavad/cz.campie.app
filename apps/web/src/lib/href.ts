import { site } from '../content/site.ts';
import type { Href } from '../content/types.ts';
import { appUrl } from './site-env.ts';

const APP_PREFIX = 'app:';

// A content link for a page of this site: platform links get the build's app URL, the rest stay as written.
export function href(target: Href): string {
  return target.startsWith(APP_PREFIX) ? appUrl + target.slice(APP_PREFIX.length) : target;
}

// The same link made absolute, for Markdown, llms.txt and structured data read outside the site.
export function absoluteHref(target: Href): string {
  const resolved = href(target);
  return resolved.startsWith('/') ? site.url + resolved : resolved;
}

// The canonical URL of a page of this site: production's, the root with its slash, the rest without one.
export function pageUrl(path: string): string {
  return path === '/' ? `${site.url}/` : site.url + path;
}
