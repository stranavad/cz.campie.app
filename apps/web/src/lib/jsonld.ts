import { faq } from '../content/faq.ts';
import { features } from '../content/features.ts';
import { pages, type IndexedPageKey } from '../content/seo.ts';
import { site } from '../content/site.ts';
import { pageUrl } from './href.ts';
import { toPlain } from './inline.ts';

const ORGANIZATION_ID = `${site.url}/#organization`;
const WEBSITE_ID = `${site.url}/#website`;

// The schema.org graph of a page: who runs the site on every page, the product and its FAQ on the home
// page, the breadcrumb on the others. No ratings or reviews.
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
      founder: { '@type': 'Person', name: site.operator.name },
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
  return [
    ...common,
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: site.name, item: pageUrl(pages.home.path) },
        { '@type': 'ListItem', position: 2, name: page.breadcrumb, item: pageUrl(page.path) },
      ],
    },
  ];
}

// Serialised for a <script type="application/ld+json"> block: "<" is escaped so no text can close it.
export function jsonLd(key: IndexedPageKey): string {
  return JSON.stringify({ '@context': 'https://schema.org', '@graph': graph(key) }).replaceAll('<', '\\u003c');
}
