import { faq } from '../content/faq.ts';
import { features } from '../content/features.ts';
import { guideBySlug } from '../content/kit/guides/index.ts';
import { isDocumentKey, isGuideKey, pages, type IndexedPageKey } from '../content/seo.ts';
import { site } from '../content/site.ts';
import { ogImageUrl, pageUrl } from './href.ts';
import { toPlain } from './inline.ts';
import { webyGraph } from './jsonld-weby.ts';
import { guideEntries, guideHref } from './kit/links.ts';
import { breadcrumbTrail } from './nav.ts';

const ORGANIZATION_ID = `${site.url}/#organization`;
const WEBSITE_ID = `${site.url}/#website`;

// The schema.org graph of a page: who runs the site on every page, the product and its FAQ on the home
// page, the breadcrumb on the others, and on a guide or a document of the kit the article it is. No
// ratings or reviews.
function graph(key: IndexedPageKey) {
  const page = pages[key];
  const common = [
    {
      '@type': 'Organization',
      '@id': ORGANIZATION_ID,
      name: site.name,
      url: `${site.url}/`,
      logo: `${site.url}/apple-touch-icon.png`,
      email: site.email,
      founder: {
        '@type': 'Person',
        name: site.operator.name,
        affiliation: { '@type': 'Organization', name: site.origin.name, url: site.origin.url },
      },
      identifier: { '@type': 'PropertyValue', propertyID: 'IČO', value: site.operator.ico },
      sameAs: [site.repoUrl],
    },
    {
      '@type': 'WebSite',
      '@id': WEBSITE_ID,
      name: site.name,
      url: `${site.url}/`,
      inLanguage: site.language,
      publisher: { '@id': ORGANIZATION_ID },
    },
  ];
  if (page.breadcrumb === null) {
    return [
      ...common,
      {
        '@type': 'SoftwareApplication',
        name: site.name,
        url: `${site.url}/`,
        description: page.description,
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Web',
        inLanguage: site.language,
        license: site.licenseUrl,
        offers: { '@type': 'Offer', price: 0, priceCurrency: 'CZK' },
        featureList: features.groups.flatMap((group) => group.items.map((item) => item.title)),
        publisher: { '@id': ORGANIZATION_ID },
      },
      {
        '@type': 'FAQPage',
        mainEntity: faq.map((item) => ({
          '@type': 'Question',
          name: item.question,
          acceptedAnswer: { '@type': 'Answer', text: toPlain(item.answer) },
        })),
      },
    ];
  }
  // The same trail the page shows (lib/nav.ts).
  const breadcrumb = {
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbTrail(key).map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.label,
      item: pageUrl(item.href),
    })),
  };
  if (key === 'weby') {
    return [...common, breadcrumb, ...webyGraph(ORGANIZATION_ID)];
  }
  if (key === 'kit') {
    // The hub: the guides as a list, dated by the latest day a guide was checked.
    return [
      ...common,
      breadcrumb,
      {
        '@type': 'CollectionPage',
        name: page.og.title,
        description: page.description,
        url: pageUrl(page.path),
        inLanguage: site.language,
        dateModified: page.lastModified,
        publisher: { '@id': ORGANIZATION_ID },
        mainEntity: {
          '@type': 'ItemList',
          itemListElement: guideEntries.map((entry, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: guideBySlug[entry.slug].nav,
            url: pageUrl(guideHref(entry.slug)),
          })),
        },
      },
    ];
  }
  if (!isGuideKey(key) && !isDocumentKey(key)) {
    return [...common, breadcrumb];
  }
  // A guide or a document is dated by the day it was last checked against its sources.
  return [
    ...common,
    breadcrumb,
    {
      '@type': 'Article',
      headline: page.og.title,
      description: page.description,
      url: pageUrl(page.path),
      mainEntityOfPage: pageUrl(page.path),
      image: ogImageUrl(page.slug),
      inLanguage: site.language,
      datePublished: page.lastModified,
      dateModified: page.lastModified,
      author: { '@id': ORGANIZATION_ID },
      publisher: { '@id': ORGANIZATION_ID },
    },
  ];
}

// Serialised for a <script type="application/ld+json"> block: "<" is escaped so no text can close it.
export function jsonLd(key: IndexedPageKey): string {
  return JSON.stringify({ '@context': 'https://schema.org', '@graph': graph(key) }).replaceAll('<', '\\u003c');
}
