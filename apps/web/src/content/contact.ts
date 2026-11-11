import type { ContactError } from '../../worker/contact.ts';
import { site } from './site.ts';
import type { Cta, PageHero } from './types.ts';

// "Kontakt", and the two pages the form lands on without JavaScript.
export const contact = {
  hero: {
    eyebrow: 'Kontakt',
    title: 'Napište nám',
    lead: 'Chcete Campie vyzkoušet, nebo se na něco zeptat? Napište nám.',
  } satisfies PageHero,
  email: site.email,
  about: {
    title: 'Kdo za Campie stojí',
    name: 'David „Dejv“ Stráňava',
    photoAlt: 'David Stráňava visí na laně pod střechou, v ruce kanystr s vodou a vodní pistoli',
    photoCaption: 'Dejv na táboře',
    text: 'Campie vzniklo na táboře, ne v kanceláři.',
    ico: `IČO: ${site.operator.ico}`,
  },
  form: {
    label: 'Kontaktní formulář',
    name: 'Jméno',
    organisation: 'Tábor nebo organizace',
    email: 'E-mail',
    message: 'Zpráva',
    // The honeypot: hidden from people, filled in by bots.
    trap: 'Tohle pole nechte prázdné',
    submit: 'Odeslat zprávu',
    privacy:
      'Údaje z formuláře použijeme jen k odpovědi na vaši zprávu. Podrobnosti jsou v [Zásadách ochrany osobních údajů](app:/ochrana-udaju).',
    noscript: `Formulář potřebuje zapnutý JavaScript kvůli ochraně proti spamu. Napište nám rovnou na ${site.email}.`,
  },
} as const;

// What the form says while and after it sends, when the enhancement script runs.
export const contactStatus = {
  sending: 'Odesíláme…',
  sent: 'Díky, zpráva je na cestě. Ozveme se vám e-mailem.',
  failed: `Zprávu se nepodařilo odeslat. Zkuste to prosím znovu, nebo napište na ${site.email}.`,
  errors: {
    invalid: 'Zkontrolujte prosím jméno, e-mail a zprávu. Zpráva potřebuje aspoň 10 znaků.',
    captcha: 'Nepodařilo se ověřit, že nejste robot. Zkuste to prosím znovu.',
    rate_limited: 'Teď toho odešlo hodně najednou. Zkuste to prosím za minutu.',
  } satisfies Partial<Record<ContactError, string>>,
};

export const contactSent = {
  hero: {
    eyebrow: 'Kontakt',
    title: 'Zpráva je na cestě',
    lead: 'Díky, že jste napsali. Ozveme se vám na e-mail, který jste uvedli.',
  } satisfies PageHero,
  back: { label: 'Zpět na úvod', href: '/' } satisfies Cta,
};

export const contactFailed = {
  hero: {
    eyebrow: 'Kontakt',
    title: 'Zprávu se nepodařilo odeslat',
    lead: `Něco se pokazilo, zpráva k nám nedorazila. Zkuste to prosím znovu, nebo napište rovnou na ${site.email}.`,
  } satisfies PageHero,
  back: { label: 'Zkusit znovu', href: '/kontakt' } satisfies Cta,
};
