import { pages } from '../content/seo.ts';
import { site } from '../content/site.ts';
import { weby } from '../content/weby.ts';
import { pageUrl } from './href.ts';
import { toPlain } from './inline.ts';

// Weby pro tábory in schema.org: the service with its two prices, the one-off and the monthly one, and
// the page's questions as an FAQPage.
export function webyGraph(organizationId: string) {
  const page = pages.weby;
  const { price, faq } = weby;
  return [
    {
      '@type': 'Service',
      name: price.name,
      serviceType: page.og.eyebrow,
      description: page.description,
      url: pageUrl(page.path),
      areaServed: { '@type': 'Country', name: 'CZ' },
      inLanguage: site.language,
      provider: { '@id': organizationId },
      offers: [
        { '@type': 'Offer', name: price.oneOff.label, price: price.oneOff.amount, priceCurrency: 'CZK' },
        {
          '@type': 'Offer',
          name: price.monthly.label,
          price: price.monthly.amount,
          priceCurrency: 'CZK',
          priceSpecification: {
            '@type': 'UnitPriceSpecification',
            price: price.monthly.amount,
            priceCurrency: 'CZK',
            unitCode: 'MON',
          },
        },
      ],
    },
    {
      '@type': 'FAQPage',
      mainEntity: faq.items.map((item) => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: { '@type': 'Answer', text: toPlain(item.answer) },
      })),
    },
  ];
}
