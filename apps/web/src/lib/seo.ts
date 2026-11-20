import { pages, utilityPages, type IndexedPageKey, type PageKey } from '../content/seo.ts';
import { ogImageUrl, pageUrl } from './href.ts';
import { jsonLd } from './jsonld.ts';
import { isIndexable } from './site-env.ts';

export const OG_IMAGE_SIZE = { width: 1200, height: 630 } as const;

export function isIndexedPage(key: PageKey): key is IndexedPageKey {
  return key in pages;
}

// Everything <head> says about a page. Canonical URLs always name production, also on preview builds,
// which instead keep robots out.
export function pageMeta(key: PageKey) {
  if (isIndexedPage(key)) {
    const page = pages[key];
    return {
      title: page.title,
      description: page.description,
      canonical: pageUrl(page.path),
      robots: isIndexable ? 'index, follow' : 'noindex, nofollow',
      og: { title: page.og.title, image: ogImageUrl(page.slug) },
      jsonLd: jsonLd(key),
    };
  }
  const page = utilityPages[key];
  return {
    title: page.title,
    description: page.description,
    canonical: null,
    robots: 'noindex, nofollow',
    og: { title: page.title, image: ogImageUrl(pages.home.slug) },
    jsonLd: null,
  };
}

// Speculation Rules: same-site links are prefetched once the visitor shows intent (hover, touch).
export const speculationRules = JSON.stringify({
  prefetch: [{ where: { and: [{ href_matches: '/*' }, { not: { href_matches: '/api/*' } }] }, eagerness: 'moderate' }],
});
