import type { Cta, PageHero } from './types.ts';

// The site's identity and the parts every page shares: header, footer, the closing call to action and
// the 404 page.
export const site = {
  name: 'Campie',
  url: 'https://campie.cz',
  language: 'cs',
  locale: 'cs_CZ',
  email: 'info@campie.cz',
  repoUrl: 'https://github.com/stranavad/cz.campie.app',
  license: 'AGPL-3.0',
  licenseUrl: 'https://www.gnu.org/licenses/agpl-3.0.html',
  // The platform (signup, login, legal pages) per build: SITE_ENV=production links the live platform,
  // every other build the dev one.
  appUrl: {
    production: 'https://app.campie.cz',
    dev: 'https://app.dev.campie.cz',
  },
  operator: {
    name: 'David Stráňava',
    ico: '21766941',
  },
  // The Turnstile widget's site key for campie.cz and dev.campie.cz (public; the secret lives in the
  // Worker). Local builds use Cloudflare's test key instead (lib/site-env.ts).
  turnstileSiteKey: '0x4AAAAAAF7zqIpjfDkS6doX',
  // Seznam Webmaster's proof of ownership (public), a meta tag in the home page's head.
  seznamVerification: 'VgGGdF1QsXjjBtMVpYRbI8RIl4gQyNYE',
  // Umami, cookieless visit counting; only production builds load it (lib/site-env.ts).
  umami: {
    origin: 'https://umami.h.gandalfthegray.dev',
    websiteId: 'f4bd75b1-af44-4412-942a-459e832b35f6',
  },
  themeColor: {
    light: '#163A2B',
    dark: '#12291E',
  },
} as const;

const signup: Cta = { label: 'Vyzkoušet zdarma', href: 'app:/registrace-organizace' };
const login: Cta = { label: 'Přihlásit se', href: 'app:/prihlaseni' };
const contact: Cta = { label: 'Kontakt', href: '/kontakt' };
const features: Cta = { label: 'Co umí', href: '/co-umi' };
const security: Cta = { label: 'Bezpečnost a data', href: '/bezpecnost' };
const guides: Cta = { label: 'Průvodce', href: '/pruvodce' };
const documents: Cta = { label: 'Vzory', href: '/vzory' };
const weby: Cta = { label: 'Weby pro tábory', href: '/weby-pro-tabory' };
const whatIsCampie: Cta = { label: 'Co je Campie?', href: '/' };

// The site has three parts: the product (Campie), the starter kit (Průvodce a vzory) and Weby pro
// tábory. lib/nav.ts tells a page's part from its path.
export type SitePart = 'product' | 'kit' | 'weby';

// One bar on every page: four plain links, nothing unfolds. The marked link follows the page's path, the
// button on the right its part; the search shows on the kit's pages only.
export const header = {
  skipLink: 'Přeskočit na obsah',
  homeLabel: 'Campie, úvodní stránka',
  navLabel: 'Hlavní',
  menuLabel: 'Menu',
  items: { features, guides, documents, weby },
  login,
  action: {
    product: signup,
    kit: whatIsCampie,
    weby: { label: 'Chci návrhy zdarma', href: '#formular' },
  } satisfies Record<SitePart, Cta>,
  // The phone's drawer: the four links, the search, then the two actions.
  drawerSignup: { label: 'Vyzkoušet Campie zdarma', href: signup.href },
  // The search finds guides, their sections and the templates. Shown only with JavaScript.
  search: {
    close: 'Zavřít hledání',
    label: 'Hledat v průvodcích a vzorech',
    placeholder: 'Hledat, třeba „lékárnička“',
    results: 'Výsledky hledání',
    empty: 'Nic jsme nenašli. Zkuste jiné slovo, nebo projděte průvodce.',
    kinds: { guide: 'Průvodce', document: 'Vzor' },
  },
} as const;

export const breadcrumbs = {
  label: 'Drobečková navigace',
  home: site.name,
} as const;

// "Kdo za Průvodcem stojí": the block above the footer of every kit page, instead of the closing band.
export const kitAbout = {
  label: 'Kdo za Průvodcem stojí',
  title: 'Průvodce připravuje Campie',
  text: 'Přihláškový systém pro tábory od lidí, kteří tábory sami vedou.',
  action: whatIsCampie,
} as const;

// One footer on every page: the brand line, three columns, then the licence and the legal links.
export const footer = {
  navLabel: 'Patička',
  brand: 'Přihláškový systém pro dětské tábory. Průvodce a vzory zdarma pro všechny pořadatele.',
  contactLine: `${site.email} · ${site.operator.name}, IČO: ${site.operator.ico}`,
  columns: {
    product: { title: site.name, links: [features, security, login, signup] },
    camps: { title: 'Pro tábory', links: [weby, contact] },
  },
  // Every guide (under its `menu` name) and every template, so each page links them all.
  kit: {
    title: 'Průvodce a vzory',
    guides: { title: 'Průvodci', all: { label: 'Všichni průvodci', href: guides.href } },
    documents: { title: 'Vzory', all: { label: 'Všechny vzory', href: documents.href } },
  },
  license: { label: `Campie je open source pod licencí ${site.license}`, href: site.licenseUrl },
  // Off this site: llms.txt lists them as optional links.
  legal: [
    { label: 'Obchodní podmínky', href: 'app:/podminky' },
    { label: 'Ochrana osobních údajů', href: 'app:/ochrana-udaju' },
    { label: 'Zpracování dat', href: 'app:/zpracovani-dat' },
    { label: 'Zdrojový kód', href: site.repoUrl },
  ],
} as const;

// "Letos to zkuste bez tabulek": the band that closes the home page and Co umí.
export const ctaBand = {
  title: 'Letos to zkuste bez tabulek',
  text: 'Založte si tábor, nastavte přihlášku a podívejte se, jak ji uvidí rodiče. Zveřejníte až budete chtít.',
  primary: { label: 'Založit tábor zdarma', href: 'app:/registrace-organizace' },
  secondary: { label: 'Napsat nám', href: '/kontakt' },
} as const;

export const notFound = {
  hero: {
    eyebrow: '404',
    title: 'Tahle stránka tu není',
    lead: 'Odkaz je možná starý, nebo se v adrese ztratilo písmenko. Zkuste to z úvodní stránky.',
  } satisfies PageHero,
  back: { label: 'Zpět na úvod', href: '/' } satisfies Cta,
};
