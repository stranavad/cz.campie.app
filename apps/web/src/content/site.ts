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
  // every other build the staging one.
  appUrl: {
    production: 'https://app.campie.cz',
    dev: 'https://app.staging.campie.cz',
  },
  operator: {
    name: 'David Stráňava',
    ico: '21766941',
  },
  // Fill in before the first deploy: the Turnstile widget's site key for campie.cz and dev.campie.cz, from
  // the Cloudflare dashboard (it is public, the secret lives in the Worker). A production or dev build
  // fails while it is empty; local builds use Cloudflare's test key instead (lib/site-env.ts).
  turnstileSiteKey: '',
  themeColor: {
    light: '#163A2B',
    dark: '#12291E',
  },
} as const;

const signup: Cta = { label: 'Vyzkoušet zdarma', href: 'app:/registrace-organizace' };
const login: Cta = { label: 'Přihlásit se', href: 'app:/prihlaseni' };
const contact: Cta = { label: 'Kontakt', href: '/kontakt' };

export const header = {
  skipLink: 'Přeskočit na obsah',
  homeLabel: 'Campie, úvodní stránka',
  navLabel: 'Hlavní',
  menuLabel: 'Menu',
  nav: [
    { label: 'Co umí', href: '/co-umi' },
    { label: 'Pro rodiče', href: '/#rodice' },
    { label: 'Co chystáme', href: '/#chystame' },
    { label: 'Tábory s Campie', href: '/#tabory' },
    { label: 'Časté otázky', href: '/#otazky' },
  ],
  login,
  signup,
  // The mobile menu lists the navigation, then these.
  menuExtras: [contact, login],
} as const;

export const footer = {
  navLabel: 'Patička',
  license: `Campie je open source pod licencí ${site.license}.`,
  contactLine: `${site.email} · ${site.operator.name}, IČO: ${site.operator.ico}`,
  links: [
    { label: 'Bezpečnost a data', href: '/bezpecnost' },
    { label: 'Obchodní podmínky', href: 'app:/podminky' },
    { label: 'Zpracování osobních údajů', href: 'app:/zpracovani-dat' },
    { label: 'Zdrojový kód', href: site.repoUrl },
    contact,
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
