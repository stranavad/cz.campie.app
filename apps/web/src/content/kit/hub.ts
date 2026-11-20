import type { Inline, PageHero } from '../types.ts';
import { at, par } from './cite.ts';
import type { Basis, Fact, GuideGroup, IsoDate, SourceKind, TimelineStep } from './types.ts';

// /pruvodce: the starter kit's front page. What kind of event, what to do when, the guides, the
// templates and what changed.
export const hub = {
  hero: {
    eyebrow: 'Průvodce pořadatele',
    title: 'Dětský tábor podle zákona, bez hledání v paragrafech',
    lead: 'Co zařídit, kdy a podle kterého předpisu. Zdarma a bez registrace.',
  } satisfies PageHero,
  // The chip above the h1: the year's news in one short sentence, linking the page's changes. The tag is
  // `kitLabels.newTag`.
  news: 'Vedoucí nově dokládají výpis z rejstříku pro práci s dětmi',
  // The hero's three ways into the page. The templates' line follows their count.
  entries: {
    kind: { title: 'Jaká akce to je?', text: 'Od toho se odvíjí všechno ostatní' },
    when: { title: 'Kdy co zařídit', text: 'Termíny podle dne odjezdu' },
    documents: { title: 'Vzory dokumentů', text: 'ke stažení zdarma' },
  },
  seoTitle: 'Jak uspořádat dětský tábor podle zákona (2027)',
  description:
    'Průvodce pořadatele dětského tábora: ohlášení hygieně, posudky, bezinfekčnost, zdravotník, lékárnička, GDPR a novinky pro rok 2027. Každý údaj s odkazem na zákon. Vzory dokumentů ke stažení zdarma.',
  nav: 'Průvodce',

  // The first decision: which set of rules applies.
  // `rule` reads "first join second", the join quieter. `count` follows the number of rules: {guides} the
  // number of guides, {total} all rules. The small column's count ends with the "I menší akce" tag.
  decision: {
    eyebrow: 'Krok 1',
    title: 'Jaká akce to je?',
    lead: 'Od toho se odvíjí všechno ostatní. Rozhodují dvě čísla: kolik dětí do 15 let pojede a kolik dnů tábor trvá.',
    pointsTitle: 'Co z toho plyne',
    columns: [
      {
        label: 'Víc povinností',
        title: 'Zotavovací akce',
        when: '30 a více dětí do 15 let, déle než 5 dnů',
        rule: { first: '**30 a více dětí** do 15 let', join: 'a zároveň', second: '**déle než 5 dnů**' },
        cites: [par('z258', '8', '1')],
        examplesLabel: 'Příklad',
        examples: ['Letní tábor pro 40 dětí na 14 dní.'],
        count: 've všech {guides} průvodcích, psaných pro zotavovací akci',
        points: [
          'Ohlášení hygieně měsíc předem',
          'Posudek a prohlášení o bezinfekčnosti u každého dítěte',
          'Zdravotník dosažitelný 24 hodin denně',
          'Lékárnička, zdravotnický deník, instruktáž',
          'Hygienické požadavky vyhlášky v plném rozsahu',
        ],
      },
      {
        label: 'Méně povinností',
        title: 'Jiná podobná akce',
        when: 'Méně dětí, nebo 5 dnů a méně',
        rule: { first: '**Méně než 30 dětí** do 15 let', join: 'nebo', second: '**nejvýš 5 dnů**' },
        cites: [par('z258', '12')],
        examplesLabel: 'Příklady',
        examples: ['Oddílová výprava 15 dětí na 3 dny.', 'Tábor pro 25 dětí na 10 dní.'],
        count: 'z celkových {total} platí i pro vás. V průvodcích mají štítek',
        points: [
          'Hygienicky nezávadné zařízení',
          'Pitná voda jako na zotavovací akci',
          'Zdravotně způsobilý dozor',
          'Znalosti hygieny u lidí v kuchyni',
          'Od 2027 výpis z rejstříku pro práci s dětmi',
        ],
      },
    ],
    notes: {
      boundary: {
        label: 'Pozor na hranici',
        text: 'Tábor pro 40 dětí přesně na 5 dní ještě zotavovací akce není. Musí trvat **déle** než 5 dnů.',
        cites: [par('z258', '8', '1')],
      },
      business: {
        label: 'Pořádáte tábor jako firma?',
        text: 'Pobytový tábor, který nabízíte podnikatelsky, může být zájezd, se vším, co k tomu patří.',
        cites: [par('z159', '1b', '1'), at('mmrZajezd')],
        guide: 'komercni-tabor-a-zajezd',
        guidePrefix: 'Průvodce',
      },
    },
    link: 'zotavovaci-akce-nebo-jina-podobna-akce',
    linkPrefix: 'Celý průvodce:',
  },

  timeline: {
    eyebrow: 'Krok 2',
    title: 'Kdy co zařídit',
    lead: 'Pro zotavovací akci. Menší akce si z toho vezme, co se jí týká.',
    // The date field. Without JavaScript it is not shown and the timeline reads without dates.
    calculator: {
      label: 'První den tábora',
      empty: 'Zadejte datum a osa ukáže konkrétní termíny.',
      start: 'Odjezd {date}.',
      today: 'dnes',
      tomorrow: 'zítra',
      past: 'už proběhlo',
      // From two days on: two to four, five and more; {n} is the number of days.
      inDays: ['za {n} dny', 'za {n} dní'],
    },
    bridge: {
      text: 'Posudky, bezinfekčnost a souhlasy od všech dětí můžete mít na jednom místě. Campie je od rodičů vybere online a pohlídá, komu co chybí.',
      link: { label: 'Jak to funguje', href: '/co-umi' },
    },
    steps: [
      {
        when: 'Půl roku předem',
        offset: { months: -6 },
        title: 'Místo, lidé, přihlášky',
        facts: [
          {
            text: 'Ověřte, že místo splní požadavky na ubytování, vodu a hygienu.',
            basis: 'law',
            cites: [par('z258', '8', '2'), par('v106', '3')],
          },
          {
            text: 'Sežeňte zdravotníka s kvalifikací, kterou zákon uznává.',
            basis: 'law',
            cites: [par('z258', '11', '1', 'a')],
          },
          {
            text: 'K přihlášce dejte rodičům informaci o zpracování osobních údajů.',
            basis: 'law',
            cites: [at('gdpr', 'čl. 13')],
          },
        ],
        links: {
          guides: ['ubytovani-a-hygiena', 'zdravotnik-a-lekarnicka', 'osobni-udaje-a-fotografie'],
          documents: [],
        },
      },
      {
        when: 'Tři měsíce předem',
        offset: { months: -3 },
        title: 'Voda a doklady lidí',
        facts: [
          {
            text: 'Nemáte-li vodu z vodovodu, objednejte krácený rozbor. Protokol nesmí být při ohlášení starší než 3 měsíce.',
            basis: 'law',
            cites: [par('z258', '8', '4')],
          },
          {
            text: 'Řekněte vedoucím o posudek o zdravotní způsobilosti a o výpis z rejstříku trestů pro práci s dětmi. Výpis nesmí být při předání starší než 3 měsíce.',
            basis: 'law',
            cites: [par('z258', '10', '2'), par('z258from2027', '10', '4')],
          },
          {
            text: 'Rozešlete rodičům vzor posudku, ať stihnou termín u dětského lékaře.',
            basis: 'advice',
            cites: [par('z258', '9', '3')],
          },
        ],
        links: {
          guides: ['vypis-z-rejstriku-trestu-pro-praci-s-detmi', 'vedouci-a-hlavni-vedouci'],
          documents: ['posudek-o-zdravotni-zpusobilosti-ditete'],
        },
      },
      {
        when: 'Měsíc předem',
        offset: { months: -1 },
        summary: 'Ohlášení hygieně do {date}.',
        title: 'Ohlášení hygieně',
        facts: [
          {
            text: 'Ohlaste tábor krajské hygienické stanici: termín a místo, počty dětí po bězích, voda, stravování a odpovědná osoba.',
            basis: 'law',
            cites: [par('z258', '8', '3')],
          },
          {
            text: 'Pořádáte-li akci v lese, oznamte ji obci s rozšířenou působností nejméně 30 dnů předem.',
            basis: 'law',
            cites: [par('z289', '20', '5')],
          },
        ],
        links: { guides: ['povinnosti-poradatele'], documents: [] },
      },
      {
        when: 'Týden předem',
        offset: { days: -7 },
        title: 'Lékárnička, jídelníček, instruktáž',
        facts: [
          {
            text: 'Zkontrolujte lékárničku podle přílohy vyhlášky.',
            basis: 'law',
            cites: [at('v106', 'příloha č. 4')],
          },
          {
            text: 'Sestavte se zdravotníkem jídelníček a režim dne.',
            basis: 'law',
            cites: [par('z258', '11', '1', 'b')],
          },
          {
            text: 'Proveďte instruktáž všech, kdo na táboře budou působit.',
            basis: 'law',
            cites: [par('z258', '11', '2')],
          },
        ],
        links: { guides: ['zdravotnik-a-lekarnicka', 'stravovani', 'rezim-dne-a-koupani'], documents: [] },
      },
      {
        when: 'V den odjezdu',
        offset: { days: 0 },
        title: 'Převzetí dětí',
        facts: [
          {
            text: 'Od každého dítěte převezměte posudek a prohlášení o bezinfekčnosti, ne starší než jeden den. U převzetí má být zdravotník.',
            basis: 'law',
            cites: [par('z258', '9', '3'), par('z258', '11', '1', 'b')],
          },
        ],
        links: {
          guides: ['podminky-ucasti-deti'],
          documents: ['prohlaseni-o-bezinfekcnosti', 'souhlasy-rodicu-na-tabor'],
        },
      },
      {
        when: 'Během tábora',
        title: 'Deník a denní provoz',
        facts: [
          {
            text: 'Veďte zdravotnický deník a seznam účastníků.',
            basis: 'law',
            cites: [par('z258', '11', '1', 'e')],
          },
          {
            text: 'Uklízejte denně a hlídejte spánek, odpočinek a dohled u vody.',
            basis: 'law',
            cites: [par('v106', '4', '5'), par('v106', '8')],
          },
        ],
        links: { guides: ['rezim-dne-a-koupani', 'ubytovani-a-hygiena'], documents: [] },
      },
      {
        when: 'Po táboře',
        title: 'Vrátit, informovat, uschovat',
        facts: [
          {
            text: 'Vraťte posudky a informujte rodiče o zdravotních potížích dítěte a o kontaktu s infekcí.',
            basis: 'law',
            cites: [par('z258', '11', '1', 'c'), par('z258', '11', '1', 'f')],
          },
          {
            text: 'Deník, seznam účastníků, prohlášení a výpisy z posudků uschovejte na 6 měsíců.',
            basis: 'law',
            cites: [par('z258', '11', '1', 'e')],
          },
        ],
        links: { guides: ['povinnosti-poradatele'], documents: [] },
      },
    ] satisfies TimelineStep[],
  },

  guides: {
    eyebrow: 'Průvodci',
    title: 'Každé téma do hloubky',
    // The guides in the groups the hub, the menu and the footer show them in. `chips` are a guide's
    // key numbers, each a statement the guide itself makes with its source; `menu` is a shorter name
    // for the menu where the guide's `nav` is too long.
    groups: [
      {
        number: '01',
        title: 'Základ',
        guides: [
          {
            slug: 'zotavovaci-akce-nebo-jina-podobna-akce',
            icon: 'sign',
            menu: 'Zotavovací akce, nebo jiná',
            card: 'Kdy je tábor zotavovací akcí a co hrozí, když to spletete.',
            chips: ['30+ dětí', 'déle než 5 dnů'],
          },
          {
            slug: 'povinnosti-poradatele',
            icon: 'clip',
            card: 'Ohlášení hygieně, pitná voda, dokumentace a lhůty.',
            chips: ['ohlášení měsíc předem'],
          },
          {
            slug: 'komercni-tabor-a-zajezd',
            icon: 'case',
            card: 'Kdy je tábor zájezd a co s tím, když jste firma.',
            chips: ['pro firmy a živnostníky'],
          },
        ],
      },
      {
        number: '02',
        title: 'Lidé',
        guides: [
          {
            slug: 'podminky-ucasti-deti',
            icon: 'child',
            card: 'Posudek, bezinfekčnost a co s dokumenty po táboře.',
            chips: ['posudek platí 2 roky', 'bezinfekčnost max. 1 den'],
          },
          {
            slug: 'vedouci-a-hlavni-vedouci',
            icon: 'people',
            card: 'Co musí splnit vedoucí a co v zákoně nenajdete.',
            chips: [],
          },
          {
            slug: 'vypis-z-rejstriku-trestu-pro-praci-s-detmi',
            icon: 'shield',
            menu: 'Výpis z rejstříku',
            card: 'Nová povinnost pro všechny, kdo na táboře pracují s dětmi.',
            chips: ['od 1. 1. 2027', 'max. 3 měsíce starý'],
            isNew: true,
          },
          {
            slug: 'zdravotnik-a-lekarnicka',
            icon: 'cross',
            card: 'Kdo smí být zdravotníkem a co patří do lékárničky.',
            chips: ['kurz 40 hodin', 'seznam lékárničky'],
          },
        ],
      },
      {
        number: '03',
        title: 'Na táboře',
        guides: [
          {
            slug: 'ubytovani-a-hygiena',
            icon: 'tent',
            card: 'Kolik místa, jaká lůžka a co s umývárnami a záchody.',
            chips: ['2,5 m² na dítě', 'patrová lůžka od 7 let'],
          },
          {
            slug: 'stravovani',
            icon: 'pot',
            card: 'Kdo smí vařit, co musí být na jídelníčku a jak má vypadat kuchyně.',
            chips: ['teplý nápoj k snídani'],
          },
          {
            slug: 'rezim-dne-a-koupani',
            icon: 'sun',
            card: 'Spánek, odpočinek, fyzická zátěž a dohled u vody.',
            chips: ['spánek 9 a 8 hodin'],
          },
        ],
      },
      {
        number: '04',
        title: 'Papíry a data',
        guides: [
          {
            slug: 'osobni-udaje-a-fotografie',
            icon: 'lock',
            card: 'Co smíte sbírat, jak dlouho a kdy potřebujete souhlas.',
            chips: ['nejvíc výkladů úřadů'],
          },
        ],
      },
    ] satisfies GuideGroup[],
  },

  documents: {
    eyebrow: 'Vzory dokumentů · zdarma',
    title: 'Vzory platné pro sezónu 2027',
    lead: 'Ke stažení v PDF, nebo upravené na váš tábor: logo, údaje pořadatele a jen ty souhlasy, které potřebujete.',
    all: { label: 'Všechny vzory', href: '/vzory' },
  },

  changes: {
    eyebrow: 'Co se změnilo',
    title: 'Proč loňské vzory už neplatí',
    // The first change of the newest date, as the large card.
    headline: 'Zpráva roku',
    plural: ['změna', 'změny', 'změn'],
    // The older changes are folded: "Zobrazit 10 změn".
    show: 'Zobrazit',
    lead: 'Pravidla pro tábory se v posledních dvou letech změnila víc než za předchozích deset. Vzory z minulých let proto často neplatí.',
    // Facts with `since` on or after this date are listed, newest first.
    from: '2026-01-01' satisfies IsoDate,
    headings: {
      '2027-01-01': 'Od 1. ledna 2027',
      '2026-01-01': 'Od 1. ledna 2026',
    } satisfies Record<IsoDate, string>,
    // What is proposed but not law yet: stated as such, with its source.
    pending: {
      title: 'Co se teprve chystá',
      note: 'zatím neplatí',
      facts: [
        {
          text: 'Vládní návrh novely zákona o ochraně veřejného zdraví (sněmovní tisk 274) by mezi osoby způsobilé dělat zdravotníka doplnil farmaceuta, praktickou sestru a dětskou sestru. Navržená účinnost je 1. 1. 2027, sněmovna ho zatím neschválila.',
          basis: 'authority',
          cites: [at('pspTisk274')],
        },
        {
          text: 'Ministerstvo zdravotnictví připravuje zákon, který by krajské hygienické stanice nahradil jedním Národním institutem veřejného zdraví. Pokud projde, změní se adresát ohlášení tábora. Návrh je teprve ve vnitřním připomínkovém řízení.',
          basis: 'authority',
          cites: [at('mzdNewsletter')],
        },
      ] satisfies Fact[],
    },
  },

  disclaimer:
    'Průvodce shrnuje právní předpisy podle stavu k uvedenému datu a není právní radou pro konkrétní případ. Závazné je vždy znění předpisu, na které odkazujeme. Najdete-li chybu, [napište nám](/kontakt).' satisfies Inline,
} as const;

// The words the kit's pages are built from.
export const kitLabels = {
  basis: {
    law: 'Zákon',
    authority: 'Výklad úřadu',
    practice: 'Doporučení organizace',
    advice: 'Naše doporučení',
  } satisfies Record<Basis, string>,
  basisLegend: {
    law: 'Stanoví to právní předpis. Odkaz vede na konkrétní paragraf.',
    authority: 'Tak předpis vykládá ministerstvo nebo úřad. Není to závazné, ale kontrola se tím řídí.',
    practice: 'Doporučuje to zavedená organizace svým táborům. Povinnost to není.',
    advice: 'Naše doporučení. Odkaz vede na pravidlo, ze kterého vychází.',
  } satisfies Record<Basis, string>,
  // The mark of each kind in a claim row; the four are also told apart by the mark's border.
  basisMark: {
    law: '§',
    authority: 'Ú',
    practice: 'O',
    advice: 'c',
  } satisfies Record<Basis, string>,
  // Before the citations of our own advice: they name the rule it builds on.
  adviceBasedOn: 'vychází z',
  legendMore: 'Co značky znamenají',
  // The season the kit is checked for. A Fact in force from `newFrom` is tagged `newTag`.
  season: 'Sezóna 2027',
  newTag: 'Novinka 2027',
  newFrom: '2027-01-01' satisfies IsoDate,
  // Czech plural forms: one, two to four, five and more.
  rulesPlural: ['pravidlo', 'pravidla', 'pravidel'],
  templatesPlural: ['vzor', 'vzory', 'vzorů'],
  smallCount: 'platí i pro menší akce',
  smallFilter: 'Jen pravidla pro menší akce',
  smallFilterHint: 'Skryje pravidla, která platí jen pro zotavovací akci.',
  previousGuide: 'Předchozí průvodce',
  nextGuide: 'Další průvodce',
  guidesInOrder: 'Průvodci v pořadí',
  sourceKind: {
    law: 'Právní předpisy',
    authority: 'Výklady a metodiky úřadů',
    practice: 'Doporučení organizací',
  } satisfies Record<SourceKind, string>,
  legendTitle: 'Jak číst tuto stránku',
  sourcesTitle: 'Zdroje',
  quoteLabel: 'Znění předpisu',
  since: 'Platí od',
  smallToo: 'I menší akce',
  smallTooLegend: 'Platí i pro jinou podobnou akci, tedy pro méně než 30 dětí nebo 5 dnů a méně.',
  verified: 'Ověřeno',
  legalState: 'Právní stav k 1. 1. 2027',
  relatedGuides: 'Související průvodci',
  relatedDocuments: 'Vzory k tématu',
  contents: 'Na této stránce',
  breadcrumbGuides: 'Průvodce',
  breadcrumbDocuments: 'Vzory',
  readGuide: 'Číst průvodce',
  openDocument: 'Otevřít vzor',
  documentKind: { form: 'Obsah podle vyhlášky', generator: 'Upravíte na svůj tábor' },
} as const;
