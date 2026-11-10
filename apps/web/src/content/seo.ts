import { contact, contactFailed, contactSent } from './contact.ts';
import { features } from './features.ts';
import { home } from './home.ts';
import { security } from './security.ts';
import { notFound } from './site.ts';

type IsoDate = `${number}-${number}-${number}`;

// The indexed pages: each is in the sitemap and has an Open Graph image (/og/<slug>.png), a Markdown twin
// for llms.txt (/<slug>.md) and a breadcrumb name (none for the home page).
export const pages = {
  home: {
    path: '/',
    slug: 'index',
    title: 'Campie - online přihlášky na tábor, platby a souhlasy',
    description:
      'Přihláškový systém pro letní tábory. Online přihláška na tábor, platby QR kódem i kartou, souhlasy s podpisem a dokumenty na jednom místě. V pilotní sezóně 2027 zdarma.',
    og: { eyebrow: 'Přihlášky na tábor', title: home.hero.titleLines.join(' ') },
    breadcrumb: null,
    lastModified: '2026-11-10',
  },
  features: {
    path: '/co-umi',
    slug: 'co-umi',
    title: 'Co umí Campie - systém pro tábory a evidence účastníků',
    description:
      'Vlastní přihláška na letní tábor, turnusy a ceník, slevy, platby za tábor QR kódem, evidence účastníků, souhlasy online, dokumenty a exporty do Excelu.',
    og: { eyebrow: features.hero.eyebrow, title: features.hero.title },
    breadcrumb: features.hero.eyebrow,
    lastModified: '2026-11-10',
  },
  security: {
    path: '/bezpecnost',
    slug: 'bezpecnost',
    title: 'Bezpečnost a GDPR na táboře - data dětí v Campie',
    description:
      'Kde jsou data dětí, kdo je vidí a jak je chráníme. Oddělené tábory, šifrovaná rodná čísla a dokumenty, zdravotní údaje jen pro zdravotníka, otevřený zdrojový kód.',
    og: { eyebrow: security.hero.eyebrow, title: security.hero.title },
    breadcrumb: security.hero.eyebrow,
    lastModified: '2026-11-10',
  },
  contact: {
    path: '/kontakt',
    slug: 'kontakt',
    title: 'Kontakt - Campie, přihlášky na tábor online',
    description:
      'Chcete Campie vyzkoušet pro svůj tábor, nebo se na něco zeptat? Napište nám na info@campie.cz nebo přes formulář.',
    og: { eyebrow: contact.hero.eyebrow, title: contact.hero.title },
    breadcrumb: contact.hero.eyebrow,
    lastModified: '2026-11-10',
  },
} as const satisfies Record<
  string,
  {
    path: string;
    slug: string;
    title: string;
    description: string;
    og: { eyebrow: string; title: string };
    breadcrumb: string | null;
    lastModified: IsoDate;
  }
>;

// Pages that are never indexed and stay out of the sitemap.
export const utilityPages = {
  contactSent: {
    path: '/kontakt/odeslano',
    title: `${contactSent.hero.title} - Campie`,
    description: contactSent.hero.lead,
  },
  contactFailed: {
    path: '/kontakt/chyba',
    title: `${contactFailed.hero.title} - Campie`,
    description: contactFailed.hero.lead,
  },
  notFound: {
    path: '/404',
    title: `${notFound.hero.title} - Campie`,
    description: notFound.hero.lead,
  },
} as const satisfies Record<string, { path: string; title: string; description: string }>;

export type IndexedPageKey = keyof typeof pages;
export const indexedPageKeys = Object.keys(pages) as IndexedPageKey[];
export type UtilityPageKey = keyof typeof utilityPages;
export type PageKey = IndexedPageKey | UtilityPageKey;
