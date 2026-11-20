import { contact, contactFailed, contactSent } from './contact.ts';
import { features } from './features.ts';
import { home } from './home.ts';
import { documents, documentsIndex } from './kit/documents/index.ts';
import { guides } from './kit/guides/index.ts';
import { hub } from './kit/hub.ts';
import type { DocumentSlug, GuideSlug, IsoDate } from './kit/types.ts';
import { security } from './security.ts';
import { notFound } from './site.ts';
import { weby, webyFailed, webySent } from './weby.ts';

interface IndexedPage {
  path: string;
  slug: string;
  title: string;
  description: string;
  og: { eyebrow: string; title: string };
  breadcrumb: string | null;
  lastModified: IsoDate;
}

// The site's own pages: each is in the sitemap and has an Open Graph image (/og/<slug>.png), a Markdown
// twin for llms.txt (/<slug>.md) and a breadcrumb name (none for the home page).
const sitePages = {
  home: {
    path: '/',
    slug: 'index',
    title: 'Campie - online přihlášky na dětský tábor',
    description:
      'Přihláškový systém pro letní tábory. Online přihláška na tábor, platby QR kódem i kartou, souhlasy s podpisem a dokumenty na jednom místě. V pilotní sezóně 2027 zdarma.',
    og: { eyebrow: 'Přihlášky na tábor', title: home.hero.titleLines.join(' ') },
    breadcrumb: null,
    lastModified: '2026-11-10',
  },
  features: {
    path: '/co-umi',
    slug: 'co-umi',
    title: 'Co umí Campie - přihlášky, platby, souhlasy',
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
  weby: {
    path: '/weby-pro-tabory',
    slug: 'weby-pro-tabory',
    title: 'Weby pro dětské tábory - tři návrhy zdarma',
    description:
      'Nový web pro dětský tábor. Pošlete adresu současného webu a do 5 pracovních dnů dostanete tři návrhy zdarma. 4 700 Kč za vytvoření, 300 Kč měsíčně za provoz.',
    og: { eyebrow: weby.hero.eyebrow, title: weby.hero.title },
    breadcrumb: weby.hero.eyebrow,
    lastModified: '2026-11-20',
  },
} as const satisfies Record<string, IndexedPage>;

// The starter kit: the hub /pruvodce and a page per guide below it, /pruvodce/<slug>. A guide's page
// changes when it is verified again; the hub, when any guide does.
export type GuideKey = `guide:${GuideSlug}`;

export function guideKey(slug: GuideSlug): GuideKey {
  return `guide:${slug}`;
}

const latest = (dates: readonly IsoDate[]) => dates.reduce((last, date) => (date > last ? date : last));

const kitHub: IndexedPage = {
  path: '/pruvodce',
  slug: 'pruvodce',
  title: hub.seoTitle,
  description: hub.description,
  og: { eyebrow: hub.hero.eyebrow, title: hub.hero.title },
  breadcrumb: hub.nav,
  lastModified: latest(guides.map((guide) => guide.verified)),
};

const guidePages = Object.fromEntries(
  guides.map((guide): [GuideKey, IndexedPage] => [
    guideKey(guide.slug),
    {
      path: `${kitHub.path}/${guide.slug}`,
      slug: `${kitHub.slug}/${guide.slug}`,
      title: guide.seoTitle,
      description: guide.description,
      og: { eyebrow: hub.nav, title: guide.title },
      breadcrumb: guide.nav,
      lastModified: guide.verified,
    },
  ]),
) as Record<GuideKey, IndexedPage>;

// The document templates: the list /vzory and a page per template below it, /vzory/<slug>, each with
// its blank PDF at /vzory/<slug>.pdf. A template's page changes when it is verified again.
export type DocumentKey = `document:${DocumentSlug}`;

export function documentKey(slug: DocumentSlug): DocumentKey {
  return `document:${slug}`;
}

const kitDocuments: IndexedPage = {
  path: hub.documents.all.href,
  slug: 'vzory',
  title: documentsIndex.seoTitle,
  description: documentsIndex.description,
  og: { eyebrow: documentsIndex.hero.eyebrow, title: documentsIndex.hero.title },
  breadcrumb: documentsIndex.nav,
  lastModified: latest(documents.map((item) => item.verified)),
};

const documentPages = Object.fromEntries(
  documents.map((item): [DocumentKey, IndexedPage] => [
    documentKey(item.slug),
    {
      path: `${kitDocuments.path}/${item.slug}`,
      slug: `${kitDocuments.slug}/${item.slug}`,
      title: item.seoTitle,
      description: item.description,
      og: { eyebrow: documentsIndex.nav, title: item.pageTitle },
      breadcrumb: item.pageTitle,
      lastModified: item.verified,
    },
  ]),
) as Record<DocumentKey, IndexedPage>;

// The indexed pages, in the order llms.txt lists them.
export const pages = { ...sitePages, kit: kitHub, ...guidePages, documents: kitDocuments, ...documentPages };

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
  webySent: {
    path: '/weby-pro-tabory/odeslano',
    title: `${webySent.hero.title} - Campie`,
    description: webySent.hero.lead,
  },
  webyFailed: {
    path: '/weby-pro-tabory/chyba',
    title: `${webyFailed.hero.title} - Campie`,
    description: webyFailed.hero.lead,
  },
  notFound: {
    path: '/404',
    title: `${notFound.hero.title} - Campie`,
    description: notFound.hero.lead,
  },
} as const satisfies Record<string, { path: string; title: string; description: string }>;

export type SitePageKey = keyof typeof sitePages;
export type IndexedPageKey = keyof typeof pages;
export const indexedPageKeys = Object.keys(pages) as IndexedPageKey[];

export function isGuideKey(key: IndexedPageKey): key is GuideKey {
  return key.startsWith('guide:');
}

export function guideSlug(key: GuideKey): GuideSlug {
  return key.slice('guide:'.length) as GuideSlug;
}

export function isDocumentKey(key: IndexedPageKey): key is DocumentKey {
  return key.startsWith('document:');
}

export function documentSlug(key: DocumentKey): DocumentSlug {
  return key.slice('document:'.length) as DocumentSlug;
}
export type UtilityPageKey = keyof typeof utilityPages;
export type PageKey = IndexedPageKey | UtilityPageKey;
