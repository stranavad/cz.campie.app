import type { IconName } from './icons.ts';
import { site } from './site.ts';
import type { Cta, FaqItem, Inline, PageHero } from './types.ts';

// "Weby pro tábory": a new website for a camp, three proposals free. In section order, then the form's
// words and the two pages the form lands on without JavaScript.
const formId = 'formular';
const cta: Cta = { label: 'Chci návrhy zdarma', href: `#${formId}` };

export const weby = {
  hero: {
    eyebrow: 'Weby pro tábory',
    title: 'Ukážeme vám, jak by váš web mohl vypadat',
    lead: 'Pošlete nám adresu svého webu. Zdarma vám k němu připravíme tři návrhy s vašimi texty a fotkami.',
  } satisfies PageHero,
  drawing: {
    label: 'Ilustrace: vlevo starý web Tábora Příklad, vpravo tři nové návrhy A, B a C s vodoznakem NÁVRH',
    today: 'váš web dnes',
    proposals: 'tři návrhy do 5 dnů',
    watermark: 'NÁVRH',
  },
  steps: {
    eyebrow: 'Jak to probíhá',
    title: 'Od adresy webu ke spuštění v šesti krocích',
    free: 'Zdarma',
    items: [
      { text: 'Necháte adresu webu a e-mail', free: true },
      { text: 'Do 5 pracovních dnů dostanete tři návrhy s vašimi texty a fotkami', free: true },
      { text: 'Zavoláme si na 20 minut', free: false },
      { text: 'Sepíšeme požadavky a cenu', free: false },
      { text: 'Dokončíme web a převedeme obsah', free: false },
      { text: 'Spustíme na vaší doméně', free: false },
    ],
  },
  gets: {
    eyebrow: 'Co dostanete',
    title: 'Web, o který se nemusíte starat',
    items: [
      {
        icon: 'pencil',
        title: 'Web, který si měníte sami',
        text: 'Texty, fotky i aktuality upravíte bez programátora.',
      },
      {
        icon: 'sync',
        title: '[Turnusy, ceny a volná místa přímo z Campie](/co-umi)',
        text: 'Údaje se na web berou ze systému přihlášek. Nic nepřepisujete dvakrát.',
      },
      {
        icon: 'redirect',
        title: 'Staré adresy přesměrujeme',
        text: 'Odkazy na starý web fungují dál. Nic se neztratí z vyhledávání.',
      },
      {
        icon: 'bolt',
        title: 'Rychlý web, který vyhledávače přečtou',
        text: 'Čitelný pro Google, Seznam i AI vyhledávače.',
      },
    ] satisfies { icon: IconName; title: Inline; text: string }[],
  },
  price: {
    eyebrow: 'Ceník',
    title: 'Jedna cena, žádné překvapení',
    name: 'Web pro tábor',
    oneOff: { amount: 4700, label: 'jednorázově za vytvoření webu' },
    monthly: { amount: 300, prefix: '+ ', suffix: ' měsíčně', label: 'za provoz' },
    cta,
    included: {
      title: 'V ceně webu',
      items: [
        'Web, který si měníte sami',
        'Převedení obsahu ze starého webu',
        'Přesměrování starých adres',
        'Spuštění na vaší doméně',
      ],
    },
    monthlyIncluded: {
      title: 'V měsíční platbě',
      items: ['Hosting a zálohy', '30 minut úprav každý měsíc'],
    },
  },
  rules: {
    eyebrow: 'Férová pravidla',
    title: 'Web je váš, ne náš',
    items: [
      { title: 'Doména je vaše', text: 'Je napsaná na vás a zůstane vám, ať se stane cokoli.' },
      { title: 'Kdykoli odejdete', text: 'Dostanete export celého webu a můžete s ním jít jinam.' },
      { title: 'Měsíční platba pokryje provoz', text: 'Je v ní hosting, zálohy a 30 minut úprav.' },
    ],
  },
  faq: {
    eyebrow: 'Otázky a odpovědi',
    title: 'Na co se vedoucí ptají',
    items: [
      {
        question: 'Co když se mi žádný návrh nelíbí?',
        answer:
          'Nic se neděje. Návrhy jsou zdarma a k ničemu vás nezavazují. Můžete nám napsat, co vám na nich nesedí, nebo to nechat být.',
      },
      {
        question: 'Musím mít Campie?',
        answer: 'Nemusíte. Když ale Campie používáte, turnusy, ceny a volná místa se na web berou samy.',
      },
      {
        question: 'Kdo bude web spravovat?',
        answer:
          'Texty a fotky si změníte sami, bez programátora. O hosting a zálohy se staráme my. A v měsíční platbě máte 30 minut úprav, takže drobnosti můžete nechat na nás.',
      },
      {
        question: 'Co se stane se starým webem?',
        answer:
          'Obsah z něj převedeme na nový web a staré adresy přesměrujeme. Kdo klikne na starý odkaz, dostane se na správnou novou stránku. Doména zůstává vaše.',
      },
      {
        question: 'Jak dlouho to trvá?',
        answer:
          'Návrhy dostanete do 5 pracovních dnů. Termín dokončení si domluvíme na společném hovoru - záleží hlavně na tom, kolik obsahu převádíme.',
      },
    ] satisfies FaqItem[],
  },
  end: {
    id: formId,
    eyebrow: 'Tři návrhy zdarma',
    title: 'Podívejte se, jak by váš web mohl vypadat',
    lead: 'Stačí adresa současného webu a e-mail. Zbytek je na nás.',
  },
  form: {
    label: 'Chci tři návrhy webu zdarma',
    url: 'Adresa současného webu',
    urlPlaceholder: 'www.tabor-priklad.cz',
    urlError: 'Zadejte prosím adresu webu, třeba www.tabor-priklad.cz.',
    email: 'Váš e-mail',
    emailPlaceholder: 'vedouci@tabor-priklad.cz',
    emailError: 'Tenhle e-mail nevypadá správně. Zkontrolujte ho prosím.',
    // The honeypot: hidden from people, filled in by bots.
    trap: 'Tohle pole nechte prázdné',
    submit: cta.label,
    fine: 'Do 5 pracovních dnů. Bez závazku.',
    failed: `**Nepodařilo se odeslat.** Zkuste to prosím znovu, nebo nám napište na [${site.email}](mailto:${site.email}).`,
    noscript: `Formulář potřebuje zapnutý JavaScript kvůli ochraně proti spamu. Adresu webu nám můžete poslat i na ${site.email}.`,
    sent: {
      title: 'Děkujeme, ozveme se do 5 pracovních dnů',
      before: 'Tři návrhy pošleme na ',
      after: '. Nic dalšího teď dělat nemusíte.',
      again: 'Poslat jinou adresu',
    },
  },
} as const;

export const webySent = {
  hero: {
    eyebrow: weby.hero.eyebrow,
    title: weby.form.sent.title,
    lead: 'Tři návrhy pošleme na e-mail, který jste uvedli. Nic dalšího teď dělat nemusíte.',
  } satisfies PageHero,
  back: { label: 'Zpět na Weby pro tábory', href: '/weby-pro-tabory' } satisfies Cta,
};

export const webyFailed = {
  hero: {
    eyebrow: weby.hero.eyebrow,
    title: 'Nepodařilo se odeslat',
    lead: `Něco se pokazilo, adresa k nám nedorazila. Zkuste to prosím znovu, nebo nám ji pošlete na ${site.email}.`,
  } satisfies PageHero,
  back: { label: 'Zkusit znovu', href: `/weby-pro-tabory#${formId}` } satisfies Cta,
};
