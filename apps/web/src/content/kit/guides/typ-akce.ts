import { at, par } from '../cite.ts';
import type { Guide } from '../types.ts';

export const typAkce = {
  slug: 'zotavovaci-akce-nebo-jina-podobna-akce',
  nav: 'Zotavovací akce, nebo jiná podobná akce',
  title: 'Zotavovací akce, nebo jiná podobná akce?',
  seoTitle: 'Zotavovací akce, nebo jiná podobná akce: co platí (2027)',
  description:
    'Kdy je dětský tábor zotavovací akcí podle zákona č. 258/2000 Sb., co platí pro menší a kratší akce a jaké pokuty hrozí. Každý údaj s odkazem na paragraf.',
  lead: 'Od odpovědi se odvíjí skoro všechno ostatní: ohlášení hygieně, posudky, zdravotník i lékárnička. Rozhodují dvě čísla, počet dětí a počet dnů.',
  summary: 'Počet dětí a dnů rozhoduje, které povinnosti se vás týkají.',
  sections: [
    {
      id: 'zotavovaci-akce',
      title: 'Kdy je tábor zotavovací akcí',
      facts: [
        {
          text: 'Zotavovací akce je organizovaný pobyt **30 a více dětí do 15 let** na dobu **delší než 5 dnů**. Obě podmínky musí platit zároveň.',
          basis: 'law',
          cites: [par('z258', '8', '1')],
          quote:
            'Zotavovací akcí je organizovaný pobyt 30 a více dětí ve věku do 15 let na dobu delší než 5 dnů, jehož účelem je posílit zdraví dětí, zvýšit jejich tělesnou zdatnost, popřípadě i získat specifické znalosti nebo dovednosti.',
        },
        {
          text: 'Za dítě do 15 let se počítá i dítě, které patnácté narozeniny oslaví kdykoli v roce, kdy se tábor koná.',
          basis: 'law',
          cites: [par('z258', '8', '1')],
          quote:
            'Pro účely účasti na zotavovací akci se za dítě ve věku do 15 let považuje i dítě, které v kalendářním roce, kdy je zotavovací akce pořádána, dovrší věk 15 let.',
        },
        {
          text: 'Zotavovací akce se může skládat z více běhů (turnusů). Ohlašujete ji jednou, s počtem dětí a termínem každého běhu.',
          basis: 'law',
          cites: [par('z258', '8', '1'), par('z258', '8', '3', 'b')],
        },
        {
          text: 'Pořádající osobou je ten, kdo děti na akci přijal. Může to být spolek, firma i fyzická osoba, zákon mezi nimi nerozlišuje.',
          basis: 'law',
          cites: [par('z258', '8', '2'), par('z258', '92d', '3')],
        },
      ],
    },
    {
      id: 'jina-podobna-akce',
      title: 'Menší nebo kratší akce: jiná podobná akce',
      intro: 'Víkendovka, výprava, tábor pro dvacet dětí. Zákon je nenechává bez pravidel, jen jich je mnohem méně.',
      facts: [
        {
          text: 'Jiná podobná akce je organizovaný pobyt dětí v menším počtu nebo na kratší dobu, než má zotavovací akce. Výjimkou jsou akce pro děti v poměru rodinném a obdobném.',
          basis: 'law',
          cites: [par('z258', '12')],
          smallToo: true,
        },
        {
          text: 'Pořadatel musí zajistit **hygienicky nezávadný stav zařízení** a **pitnou vodu** ve stejném rozsahu jako na zotavovací akci.',
          basis: 'law',
          cites: [par('z258', '12'), par('v106', '5')],
          smallToo: true,
        },
        {
          text: 'Dozor a zdravotník musí být zdravotně způsobilí a lidé u stravování musí mít znalosti nutné k ochraně veřejného zdraví.',
          basis: 'law',
          cites: [par('z258', '12'), par('z258', '10', '1'), par('z258', '10', '3')],
          smallToo: true,
        },
        {
          text: 'Od 1. 1. 2027 platí i pro jinou podobnou akci, že na ní nesmí působit nikdo se záznamem v evidenci skutečností důležitých pro práci s dětmi.',
          basis: 'law',
          cites: [par('z258from2027', '12'), par('z258from2027', '10', '4')],
          since: '2027-01-01',
          smallToo: true,
        },
        {
          text: 'Ohlášení hygieně, posudek dítěte, prohlášení o bezinfekčnosti, zdravotník, zdravotnický deník ani lékárnička podle vyhlášky se na jinou podobnou akci ze zákona nevztahují. Paragraf 12 vyjmenovává jen povinnosti uvedené výše.',
          basis: 'law',
          cites: [par('z258', '12')],
          smallToo: true,
        },
        {
          text: 'Ministerstvo zdravotnictví přesto ohlášení menších akcí vítá: údaje převezme i registr hasičů pro případ mimořádné události. V sezóně 2026 se takto dobrovolně ohlásilo 363 akcí.',
          basis: 'authority',
          cites: [at('mzdRekreace')],
          smallToo: true,
        },
        {
          text: 'I na menší akci doporučujeme vyžádat si od rodičů prohlášení o bezinfekčnosti a mít s sebou lékárničku. Nic to nestojí a vyhnete se tomu, že jedno nemocné dítě ukončí akci všem.',
          basis: 'advice',
          cites: [par('z258', '9', '1'), at('v106', 'příloha č. 4')],
          smallToo: true,
        },
      ],
    },
    {
      id: 'kontroly-a-pokuty',
      title: 'Kontroly a pokuty',
      facts: [
        {
          text: 'Krajská hygienická stanice může stanovit podmínky konání zotavovací akce i jiné podobné akce a při ohrožení veřejného zdraví ji zakázat.',
          basis: 'law',
          cites: [par('z258', '84', '1', 'k')],
          smallToo: true,
        },
        {
          text: 'Za neohlášení akce, přijetí dítěte bez posudku nebo bezinfekčnosti a za nesplnění povinností kolem zdravotníka a dokumentace hrozí pokuta **do 30 000 Kč**.',
          basis: 'law',
          cites: [par('z258', '92d', '3'), par('z258', '92d', '8')],
        },
        {
          text: 'Stejná horní hranice platí za porušení hygienických požadavků na ubytování, vodu, stravování nebo režim dne a za přijetí nezpůsobilého dozoru, zdravotníka nebo kuchaře.',
          basis: 'law',
          cites: [par('z258', '92d', '4'), par('z258', '92d', '5'), par('z258', '92d', '8')],
          smallToo: true,
        },
        {
          text: 'Za neprovedenou instruktáž osob činných na akci je pokuta do 5 000 Kč.',
          basis: 'law',
          cites: [par('z258', '92d', '5', 'b'), par('z258', '92d', '8')],
        },
        {
          text: 'V létě 2026 provedly hygienické stanice 1 055 kontrol zotavovacích akcí a 83 kontrol jiných podobných akcí.',
          basis: 'authority',
          cites: [at('mzdRekreace')],
        },
      ],
    },
  ],
  related: {
    guides: ['povinnosti-poradatele', 'podminky-ucasti-deti', 'komercni-tabor-a-zajezd'],
    documents: ['prohlaseni-o-bezinfekcnosti'],
  },
  verified: '2026-11-19',
} as const satisfies Guide;
