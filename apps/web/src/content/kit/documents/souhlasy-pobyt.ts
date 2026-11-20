import { at, par } from '../cite.ts';
import type { DocumentTemplate } from './types.ts';

export const souhlasyPobyt = {
  slug: 'souhlasy-rodicu-na-tabor',
  seoTitle: 'Souhlasy rodičů na tábor: ošetření, léky - vzor 2027 (PDF)',
  description:
    'Vzor souhlasů rodičů k pobytu dítěte na táboře: podávání léků, doprovod k lékaři, převoz autem, společné ubytování, samostatný pohyb. Vyberete, co se vás týká, a stáhnete PDF.',
  pageTitle: 'Souhlasy rodičů k pobytu na táboře',
  lead: 'Jeden list místo pěti. U každého bodu vidíte, jestli ho žádá zákon, nebo jen zdravý rozum, a co na něm rodičův podpis opravdu změní.',
  title: 'Souhlasy a prohlášení zákonného zástupce k pobytu dítěte na táboře',
  kind: 'template',
  before: [
    { type: 'event', blankWhenEmpty: false },
    {
      type: 'fields',
      fields: [
        { label: 'Jméno a příjmení dítěte', width: 'full' },
        { label: 'Datum narození', width: 'half' },
      ],
    },
    {
      type: 'paragraph',
      text: 'Každý bod můžete udělit nebo odmítnout zvlášť. Odmítnutí se projeví jen v rozsahu dané aktivity.',
    },
  ],
  items: [
    {
      id: 'volne-prodejne-leky',
      title: 'Podání volně prodejných léků',
      text: 'Zdravotník tábora může dítěti při běžných obtížích (například bolest hlavy, zvýšená teplota, bolest v krku, nevolnost nebo štípnutí hmyzem) podat volně prodejné léčivé přípravky z táborové lékárničky.',
      kind: 'choice',
      fields: [{ label: 'Léky a látky, které dítě nesnáší', width: 'full' }],
      defaultOn: true,
      why: {
        text: 'Lékárnička smí obsahovat jen volně prodejné přípravky a podávání léků je součástí kurzu zdravotníka. Souhlas zákon nežádá; dává zdravotníkovi jistotu a vám zprávu o tom, co dítěti nepodávat.',
        basis: 'advice',
        cites: [at('v106', 'příloha č. 4, část I'), at('v106', 'příloha č. 2, bod 4.5')],
      },
    },
    {
      id: 'pravidelne-leky',
      title: 'Léky, které dítě užívá pravidelně',
      text: 'Léky, které dítě pravidelně užívá, předávám při nástupu zdravotníkovi, označené jménem dítěte.',
      kind: 'statement',
      fields: [{ label: 'Název léku a dávkování', width: 'full', lines: 3 }],
      defaultOn: true,
      why: {
        text: 'Léky musí být uloženy tak, aby se k nim nedostaly děti. Dlouhodobě užívané léky uvádí i lékař v posudku; dávkování pro tábor ale potřebujete od rodiče.',
        basis: 'law',
        cites: [par('v106', '3', '6'), at('v106', 'příloha č. 3')],
      },
    },
    {
      id: 'doprovod-k-lekari',
      title: 'Doprovod k lékaři',
      text: 'Určuji vedoucího tábora, zdravotníka nebo jinou zletilou osobu pověřenou pořadatelem jako osobu, která může dítě doprovodit k lékaři a být přítomna při poskytování zdravotních služeb. Souhlasím, aby jí lékař sdělil informace potřebné pro péči o dítě po dobu pobytu.',
      kind: 'choice',
      defaultOn: true,
      why: {
        text: 'Nezletilý pacient má právo na nepřetržitou přítomnost zákonného zástupce nebo osoby, kterou zákonný zástupce určil. Tímto bodem ji rodič určuje.',
        basis: 'law',
        cites: [par('z372', '28', '3', 'e')],
      },
    },
    {
      id: 'osetreni',
      title: 'Ošetření dítěte',
      text: 'Beru na vědomí, že mě pořadatel o ošetření dítěte bez zbytečného odkladu informuje. Pokud mě u neodkladné nebo akutní péče nebude možné včas zastihnout, rozhodne o jejím poskytnutí ošetřující zdravotnický pracovník.',
      kind: 'statement',
      defaultOn: true,
      why: {
        text: 'Tak to stanoví zákon o zdravotních službách, ať rodič podepíše cokoli. Vzor proto neobsahuje "souhlas s ošetřením za rodiče": takový předem daný souhlas zákon nezná a lékař se o něj opřít nemusí.',
        basis: 'law',
        cites: [par('z372', '35', '3'), par('z258', '11', '1', 'f')],
      },
    },
    {
      id: 'prevoz-autem',
      title: 'Převoz osobním automobilem',
      text: 'Dítě může být k lékaři nebo v jiném nutném případě převezeno osobním automobilem, který řídí osoba pověřená pořadatelem, v autosedačce nebo na podsedáku, pokud to výška a hmotnost dítěte vyžadují.',
      kind: 'choice',
      defaultOn: true,
      why: {
        text: 'Dítě do 36 kg a 150 cm smí jet autem jen v dětské autosedačce. Souhlas rodiče na tom nic nemění; mějte na táboře aspoň jeden podsedák.',
        basis: 'advice',
        cites: [par('z361', '6', '1', 'c')],
      },
    },
    {
      id: 'plavec',
      title: 'Koupání',
      text: 'Dítě se může koupat pod dohledem vedoucích. Dítě je (zakroužkujte): plavec - slabý plavec - neplavec.',
      kind: 'statement',
      defaultOn: true,
      why: {
        text: 'Koupání musí odpovídat plaveckým schopnostem dětí a probíhá jen pod dohledem. Souhlas vyhláška nežádá; potřebujete vědět, kdo neumí plavat.',
        basis: 'law',
        cites: [par('v106', '8', '4')],
      },
    },
    {
      id: 'spolecne-ubytovani',
      title: 'Společné ubytování chlapců a dívek',
      text: 'Souhlasím, aby bylo dítě ubytováno společně s dětmi opačného pohlaví.',
      kind: 'choice',
      defaultOn: false,
      why: {
        text: 'Jediný souhlas, který vyhláška výslovně jmenuje: děti se ubytují odděleně podle pohlaví, pokud se společným ubytováním nevysloví souhlas zákonný zástupce.',
        basis: 'law',
        cites: [par('v106', '4', '1')],
      },
    },
    {
      id: 'samostatny-pohyb',
      title: 'Samostatný pohyb při výletech',
      text: 'Dítě se může při výletech po vymezenou dobu a ve vymezeném prostoru pohybovat bez přímého dohledu vedoucího, ve skupině nejméně tří dětí.',
      kind: 'choice',
      defaultOn: false,
      why: {
        text: 'Souhlas rodiče vás odpovědnosti za náležitý dohled nezbavuje. Ukazuje ale, že rodič o rozchodu věděl a že jste mu stanovili pravidla.',
        basis: 'advice',
        cites: [par('oz', '2920', '3'), par('oz', '2921')],
      },
    },
    {
      id: 'nocni-hra',
      title: 'Noční hra',
      text: 'Dítě se může zúčastnit noční hry pořádané pod dohledem vedoucích.',
      kind: 'choice',
      defaultOn: false,
      why: {
        text: 'Zákon souhlas nežádá. Počítejte s tím, že i po noční hře musí děti dostat osm, respektive devět hodin spánku.',
        basis: 'advice',
        cites: [par('v106', '8', '1')],
      },
    },
    {
      id: 'uplnost-udaju',
      title: 'Úplnost údajů o zdraví',
      text: 'Prohlašuji, že jsem pořadateli sdělil(a) všechna zdravotní omezení dítěte, která mohou ovlivnit jeho účast na programu tábora.',
      kind: 'statement',
      defaultOn: true,
      why: {
        text: 'Přijmout smíte jen dítě zdravotně způsobilé a posudek může být až dva roky starý. Co se změnilo od té doby, ví jen rodič.',
        basis: 'advice',
        cites: [par('z258', '9', '1', 'a'), par('z258', '9', '3')],
      },
    },
  ],
  after: [{ type: 'signature', signers: ['Podpis zákonného zástupce'] }],
  explain: {
    title: 'Co k souhlasům říká zákon',
    sections: [],
    answer: { index: 0 },
    facts: [
      {
        text: 'Ze všech bodů žádá souhlas rodiče výslovně jen jeden předpis: vyhláška u společného ubytování chlapců a dívek.',
        basis: 'law',
        cites: [par('v106', '4', '1')],
      },
      {
        text: 'O neodkladné a akutní péči rozhodne lékař i bez rodiče, pokud ho nelze včas zastihnout. Rozsáhlé "plné moci k ošetření" proto nic nepřidají.',
        basis: 'law',
        cites: [par('z372', '35', '3')],
      },
      {
        text: 'Co naopak smysl má, je určit, kdo smí být s dítětem u lékaře. Zákon s takovou osobou počítá.',
        basis: 'law',
        cites: [par('z372', '28', '3', 'e')],
      },
      {
        text: 'Vzor neobsahuje závazek rodiče uhradit škodu ani prohlášení, že pořadatel za nic neodpovídá. Odpovědnost za dohled nad dětmi určuje zákon a podpisem se jí zbavit nejde.',
        basis: 'advice',
        cites: [par('oz', '2920', '3'), par('oz', '2921')],
      },
    ],
  },
  inCampie:
    'V Campie si souhlasy poskládáte stejně, jen je rodič podepíše online. U každého dítěte pak jedním pohledem vidíte, co dovoleno má a co ne.',
  related: {
    guides: ['zdravotnik-a-lekarnicka', 'rezim-dne-a-koupani', 'ubytovani-a-hygiena'],
    documents: ['souhlas-se-zpracovanim-osobnich-udaju', 'prohlaseni-o-bezinfekcnosti'],
  },
  verified: '2026-11-19',
} as const satisfies DocumentTemplate;
