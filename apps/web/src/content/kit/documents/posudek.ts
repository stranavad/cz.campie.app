import { at, par } from '../cite.ts';
import type { DocumentTemplate } from './types.ts';

// The posudek with the content of příloha č. 3 of vyhláška č. 106/2001 Sb. as amended by 400/2025 Sb.:
// its parts, their order and its words are the regulation's, so do not reword them. The layout is ours;
// neither the act nor the regulation prescribes one.
export const posudek = {
  slug: 'posudek-o-zdravotni-zpusobilosti-ditete',
  seoTitle: 'Posudek o zdravotní způsobilosti dítěte - formulář 2027 (PDF)',
  description:
    'Aktuální vzor posudku o zdravotní způsobilosti dítěte k účasti na zotavovací akci a škole v přírodě, platný od 1. 1. 2026. Ke stažení v PDF. Kdo ho vydává a jak dlouho platí.',
  pageTitle: 'Posudek o zdravotní způsobilosti dítěte',
  lead: 'Formulář s obsahem podle vzoru z vyhlášky ve znění platném od 1. 1. 2026, na jednu stranu A4. Vytiskněte ho rodičům, vyplní ho dětský lékař.',
  title: 'POSUDEK O ZDRAVOTNÍ ZPŮSOBILOSTI DÍTĚTE K ÚČASTI NA ZOTAVOVACÍ AKCI A ŠKOLE V PŘÍRODĚ',
  kind: 'form',
  before: [
    { type: 'fields', fields: [{ label: 'Evidenční číslo posudku', width: 'half', inline: true }] },
    {
      type: 'box',
      title: '1. Identifikační údaje',
      blocks: [
        {
          type: 'fields',
          fields: [
            { label: 'Název poskytovatele zdravotních služeb vydávajícího posudek', width: 'full', inline: true },
            { label: 'Adresa sídla nebo místa podnikání poskytovatele', width: 'full' },
            { label: 'IČO', width: 'half' },
            { label: 'Jméno, popřípadě jména, a příjmení posuzovaného dítěte', width: 'full' },
            { label: 'Datum narození posuzovaného dítěte', width: 'half' },
            {
              label: 'Adresa místa trvalého pobytu nebo jiného bydliště na území České republiky posuzovaného dítěte',
              width: 'full',
            },
          ],
        },
      ],
    },
    {
      type: 'box',
      title: '2. Účel vydání posudku',
      blocks: [{ type: 'fields', fields: [{ label: '', width: 'full' }] }],
    },
    {
      type: 'box',
      title: '3. Posudkový závěr',
      blocks: [
        { type: 'heading', text: 'A) Posuzované dítě k účasti na škole v přírodě nebo zotavovací akci' },
        {
          type: 'options',
          items: [
            'a) je zdravotně způsobilé*)',
            'b) není zdravotně způsobilé*)',
            'c) je zdravotně způsobilé s omezením*) **)',
          ],
        },
        { type: 'fields', fields: [{ label: '', width: 'full' }] },
        { type: 'heading', text: 'B) Posuzované dítě' },
        {
          type: 'fields',
          fields: [
            { label: 'a) se podrobilo stanoveným pravidelným očkováním: ANO - NE', width: 'full', inline: true },
            { label: 'b) je proti nákaze imunní (typ/druh)', width: 'full', inline: true },
            { label: 'c) má kontraindikaci proti očkování (typ/druh)', width: 'full', inline: true },
            { label: 'd) je alergické na', width: 'full', inline: true },
            { label: 'e) dlouhodobě užívá léky (typ/druh, dávka)', width: 'full', inline: true },
          ],
        },
        {
          type: 'note',
          text: 'Poznámka:\n*) Nehodící se škrtněte.\n**) Bylo-li zjištěno, že posuzované dítě je zdravotně způsobilé s omezením, uvede se omezení podmiňující zdravotní způsobilost k účasti na zotavovací akci a škole v přírodě.',
        },
      ],
    },
    {
      type: 'box',
      title: '4. Poučení',
      blocks: [
        {
          type: 'note',
          text: 'Proti bodu 3. části A) tohoto posudku lze podle § 46 odst. 1 zákona č. 373/2011 Sb., o specifických zdravotních službách, ve znění pozdějších předpisů, podat návrh na jeho přezkoumání do 10 pracovních dnů ode dne jeho prokazatelného předání poskytovatelem zdravotních služeb, který posudek vydal. Práva na přezkoumání lékařského posudku se lze vzdát. Podle § 46 odst. 3 téhož zákona nemá návrh na přezkoumání lékařského posudku odkladný účinek, jestliže z jeho závěru vyplývá, že posuzovaná osoba je pro účel, pro nějž byla posuzována, zdravotně nezpůsobilá nebo zdravotně způsobilá s podmínkou.',
        },
      ],
    },
    {
      type: 'box',
      title: '5. Oprávněná osoba',
      blocks: [
        {
          type: 'fields',
          fields: [
            { label: 'Jméno, popřípadě jména, a příjmení oprávněné osoby', width: 'full', inline: true },
            {
              label: 'Vztah k posuzovanému dítěti (zákonný zástupce, opatrovník, pěstoun popř. další příbuzný dítěte)',
              width: 'full',
              inline: true,
            },
            { label: 'Oprávněná osoba převzala posudek do vlastních rukou dne', width: 'half' },
            { label: 'Podpis oprávněné osoby', width: 'half' },
          ],
        },
      ],
    },
  ],
  items: [],
  after: [
    {
      type: 'fields',
      fields: [
        { label: 'Datum vydání posudku', width: 'half' },
        { label: 'Jméno, příjmení a podpis lékaře, razítko poskytovatele zdravotních služeb', width: 'full', lines: 2 },
      ],
    },
  ],
  explain: {
    title: 'Co k posudku říká zákon',
    sections: [{ guide: 'podminky-ucasti-deti', section: 'posudek' }],
    answer: { section: { guide: 'podminky-ucasti-deti', id: 'posudek' }, index: 1 },
    facts: [
      {
        text: 'Zákon říká jen to, že vzor posudku upraví vyhláška, a ta ho uvádí v příloze č. 3. Grafickou podobu, písmo ani rozložení na stránce žádný z nich nepředepisuje.',
        basis: 'law',
        cites: [par('z258', '9', '3'), at('v106', 'příloha č. 3')],
        quote: 'Vzor posudku upraví prováděcí právní předpis.',
      },
      {
        text: 'Posudek proto může vypadat různě, pokud má obsah vzoru: stejné údaje, stejné body posudkového závěru a poučení. Náš formulář je jedna z možných podob. Stejně dobře poslouží formulář, který používá lékař dítěte nebo jiná organizace.',
        basis: 'advice',
        cites: [at('v106', 'příloha č. 3')],
      },
      {
        text: 'Vlastní logo nebo hlavičku tábora si na posudek dát můžete, nic to nezakazuje. Nedoporučujeme to: posudek vydává lékař, platí dva roky a dítě ho může předložit i jinému pořadateli.',
        basis: 'advice',
        cites: [par('z258', '9', '3')],
      },
      {
        text: 'Od 1. 1. 2026 se v poučení změnila dvě místa: přibyla věta, že se práva na přezkoumání lze vzdát, a odkaz na § 46 odst. 3. Formuláře z dřívějších let je nemají.',
        basis: 'law',
        cites: [at('v400', 'bod 42')],
        since: '2026-01-01',
      },
      {
        text: 'Posudek vystavený na starším formuláři nepřestává platit: zákon váže platnost na dva roky od vystavení, ne na podobu tiskopisu. Nové posudky ale dávejte vyplnit na formulář s aktuálním zněním.',
        basis: 'advice',
        cites: [par('z258', '9', '3')],
      },
    ],
  },
  inCampie:
    'V Campie rodič posudek vyfotí a nahraje k přihlášce. Vy vidíte, komu chybí a komu do tábora vyprší, a originál si dítě přiveze v den odjezdu.',
  related: {
    guides: ['podminky-ucasti-deti', 'zdravotnik-a-lekarnicka'],
    documents: ['prohlaseni-o-bezinfekcnosti', 'souhlasy-rodicu-na-tabor'],
  },
  verified: '2026-11-19',
} as const satisfies DocumentTemplate;
