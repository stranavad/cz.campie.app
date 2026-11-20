import type { PageHero } from '../../types.ts';
import type { DocumentSlug } from '../types.ts';
import { bezinfekcnost } from './bezinfekcnost.ts';
import { posudek } from './posudek.ts';
import { souhlasUdaje } from './souhlas-udaje.ts';
import { souhlasyPobyt } from './souhlasy-pobyt.ts';
import type { DocumentTemplate } from './types.ts';

// The templates in the order /vzory lists them.
export const documents: readonly DocumentTemplate[] = [bezinfekcnost, posudek, souhlasUdaje, souhlasyPobyt];

export const templateBySlug = Object.fromEntries(documents.map((item) => [item.slug, item])) as Record<
  DocumentSlug,
  DocumentTemplate
>;

// /vzory: the list of templates.
export const documentsIndex = {
  hero: {
    eyebrow: 'Vzory dokumentů',
    title: 'Vzory dokumentů na dětský tábor',
    lead: 'Aktuální pro sezónu 2027. Stáhněte prázdný vzor, nebo si ho upravte: logo, údaje pořadatele a jen ty body, které potřebujete. Zdarma, bez registrace, nic neodesíláme.',
  } satisfies PageHero,
  seoTitle: 'Vzory dokumentů na dětský tábor 2027 zdarma',
  description:
    'Vzory dokumentů pro pořadatele dětských táborů zdarma: prohlášení o bezinfekčnosti, posudek o zdravotní způsobilosti, souhlas s fotografováním a souhlasy rodičů. PDF ke stažení i s hlavičkou vašeho tábora.',
  nav: 'Vzory',
  guides: { label: 'Průvodce pořadatele: co kdy zařídit', href: '/pruvodce' },
  // The large cards' actions; a template's second action is documentLabels.customise.
  downloadBlank: 'Stáhnout prázdné PDF',
  open: 'Zobrazit vzor',
  guidesTitle: 'Průvodci, ze kterých vzory vycházejí',
  guidesLead:
    'Každý bod vzoru stojí na pravidle z některého průvodce. Tam najdete, proč ve vzoru je a podle kterého paragrafu.',
} as const;

// The words of the document pages and the configurator.
export const documentLabels = {
  downloadBlank: 'Stáhnout prázdný vzor (PDF)',
  downloadCustom: 'Stáhnout PDF',
  customise: 'Upravit na svůj tábor',
  preview: 'Náhled dokumentu',
  // The hero's two ways to the document; a form has only the first, in its own words.
  paths: {
    blank: {
      eyebrow: 'Jen potřebuju vytisknout',
      title: 'Prázdný vzor k vyplnění propiskou',
      text: 'Bez registrace a bez úprav. Vytisknete, rodič doplní údaje a podepíše.',
    },
    form: {
      eyebrow: 'Jen potřebuju vytisknout',
      title: 'Prázdný vzor k vytištění',
      text: 'S obsahem podle vyhlášky, na jednu stranu A4, bez registrace. Vytiskněte ho, nebo pošlete rodičům odkaz.',
    },
    custom: {
      eyebrow: 'Pořádám tábor',
      title: 'Upravte ho na svůj tábor',
      text: 'Doplníte logo, název a termín, vyberete body. Za dvě minuty máte vlastní dokument.',
    },
  },
  // "PDF · 1 strana · 42 kB" beside the blank download.
  pdf: 'PDF',
  kilobytes: 'kB',
  pagesPlural: ['strana', 'strany', 'stran'],
  itemsPlural: ['bod', 'body', 'bodů'],
  a4: 'A4',
  // The preview beside the configurator.
  previewLabel: 'Náhled · tak se to vytiskne',
  // The form's page: what stands where a template has its configurator.
  formWhy: {
    eyebrow: 'Obsah podle vyhlášky',
    title: 'Proč ho nabízíme bez úprav',
    text: 'Vyhláška určuje, co má posudek obsahovat, ne jak má vypadat. Platný je tedy i jinak upravený formulář se stejným obsahem. Náš je bez hlavičky tábora: posudek vyplňuje lékař, platí dva roky a dítě ho může použít i na jiné akci.',
  },
  lawEyebrow: 'Co k tomu říká zákon',
  // The page's list of the template's items, each with what it rests on.
  itemsEyebrow: 'Proč jsou ve vzoru tyto body',
  itemsWhy: 'Co který bod dělá',
  itemsWhyLead: 'Body zapnuté ve výchozím stavu jsou v prázdném vzoru. Ostatní si zapnete v úpravě vzoru.',
  defaultOn: 'Ve výchozím stavu zapnuto',
  defaultOff: 'Ve výchozím stavu vypnuto',
  related: 'Související',
  relatedGuides: 'Průvodce k tématu',
  relatedDocuments: 'Další vzory',
  sources: 'Zdroje',
  configurator: {
    eyebrow: 'Konfigurátor',
    title: 'Upravit na svůj tábor',
    privacy: 'Všechno zůstává ve vašem prohlížeči. Na server nic neposíláme.',
    // "návrat": the organiser's data were found in this browser.
    returning: {
      title: 'Vítejte zpět.',
      text: 'Pořadatele a tábor jsme vyplnili z minula. Jsou uložené jen v tomto prohlížeči.',
      keep: 'V pořádku',
      clear: 'Vymazat údaje',
    },
    organiser: 'Pořadatel a tábor',
    optional: 'Vše nepovinné',
    organiserHint: 'Hlavička se objeví, jakmile vyplníte název. Údaje použijeme i u dalších vzorů.',
    organiserName: 'Název pořadatele',
    ico: 'IČO',
    address: 'Sídlo',
    email: 'E-mail',
    phone: 'Telefon',
    logo: 'Logo pořadatele',
    logoHint: 'PNG nebo JPEG, nepovinné',
    logoSet: 'Vaše logo',
    uploadLogo: 'Nahrát logo',
    removeLogo: 'Odebrat',
    // {soubor} is the chosen file's name.
    logoInvalid: 'Soubor {soubor} nejde použít. Nahrajte logo jako PNG nebo JPEG.',
    camp: 'Tábor',
    campName: 'Název tábora',
    term: 'Termín',
    place: 'Místo konání',
    // Demo values in the empty fields.
    placeholders: {
      name: 'Spolek Tábor Příklad, z. s.',
      ico: '12345678',
      address: 'Lesní 12, 123 45 Příkladov',
      email: 'info@tabor-priklad.cz',
      phone: '777 123 456',
      campName: 'Letní tábor Příklad 2027',
      term: '12. 7. - 25. 7. 2027',
      place: 'Tábořiště U Potoka',
    },
    items: 'Body dokumentu',
    reset: 'Vrátit výchozí',
    fixedNote:
      'Úvod, údaje o dítěti a podpis jsou pevnou součástí vzoru. Vypnout ani přepsat je nejde, aby dokument zůstal tím, čím má být.',
    itemsOn: 'V dokumentu',
    itemsOff: 'Můžete přidat',
    whyItem: 'Proč to tam je:',
    editItem: 'Upravit znění',
    doneItem: 'Hotovo',
    itemTitle: 'Nadpis bodu',
    itemText: 'Text bodu',
    restoreItem: 'Vrátit původní znění',
    edited: 'Upraveno',
    own: 'Vlastní bod',
    removeItem: 'Odebrat',
    addItem: 'Přidat vlastní bod',
    customItemTitle: 'Vlastní bod',
    newTitle: 'Nadpis',
    newTitlePlaceholder: 'Například: Odvoz z tábora',
    newText: 'Text',
    newTextPlaceholder: 'Co má rodič potvrdit',
    itemKind: 'Jak rodič odpoví',
    kindChoice: 'Zaškrtne souhlasím / nesouhlasím',
    kindStatement: 'Stvrdí podpisem',
    addToDocument: 'Přidat do dokumentu',
    cancel: 'Zrušit',
    download: 'Stáhnout',
    credit: 'Ponechat v zápatí řádek „Vzor: campie.cz/vzory“',
    creditHint: 'Pomůže dalším táborům najít aktuální vzor. Klidně ho vypněte.',
    generating: 'Připravuji PDF…',
    generatingHint: 'Poprvé to chvíli trvá: do prohlížeče se stahuje písmo a nástroj na PDF. Nic se přitom neodesílá.',
    failed:
      'PDF se nepodařilo vytvořit. Zkuste to znovu. Pokud to nepomůže, stáhněte prázdný vzor a doplňte údaje ručně.',
    retry: 'Zkusit znovu',
    downloaded: 'Staženo:',
    close: 'Zavřít',
    // Phones: the form, the preview behind a button.
    show: 'Zobrazit',
    showForm: 'Upravit',
    showPreview: 'Náhled',
    // {strany} is "2 strany", "5 stran".
    morePages:
      'Dokument teď vychází na {strany}. Na jednu stranu se vrátí, když některý bod vypnete nebo zkrátíte jeho znění.',
  },
  // The words printed in a document, apart from the template's own texts.
  printed: {
    ico: 'IČO',
    camp: 'Tábor',
    term: 'Termín',
    place: 'Místo konání',
    agree: 'souhlasím',
    disagree: 'nesouhlasím',
    place_date: 'V',
    date: 'dne',
    credit: 'Vzor: campie.cz/vzory, právní stav k 1. 1. 2027',
  },
  afterDownload: {
    title: 'A příští rok bez papírů?',
    cta: { label: 'Vyzkoušet Campie zdarma', href: 'app:/registrace-organizace' },
  },
} as const;
