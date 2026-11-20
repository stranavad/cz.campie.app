import { at, par } from '../cite.ts';
import type { Guide } from '../types.ts';

export const ubytovani = {
  slug: 'ubytovani-a-hygiena',
  nav: 'Ubytování a hygiena',
  title: 'Ubytování, stany, hygiena a úklid',
  seoTitle: 'Hygienické požadavky na dětský tábor: ubytování, stany (2027)',
  description:
    'Co vyhláška č. 106/2001 Sb. žádá po ubytování v budově i ve stanech, po umývárnách a záchodech a po úklidu. Včetně změn od 1. 1. 2026, kdy zmizely pevné počty umyvadel a sprch.',
  lead: 'Od roku 2026 vyhláška ustoupila od počítání umyvadel a sprch. Zůstal požadavek, který se špatně měří a dobře pozná: soukromí a čisto.',
  summary: 'Plocha na dítě, stany, umývárny, záchody, lůžka a úklid.',
  sections: [
    {
      id: 'ubytovani',
      title: 'Budovy a stany',
      facts: [
        {
          text: 'Zotavovací akce se pořádají ve stavbách nebo ve stanech. Prostory ve stavbách musí být suché, s přirozeným větráním a osvětlením, a na jedno ubytované dítě musí připadat **nejméně 2,5 m²**.',
          basis: 'law',
          cites: [par('v106', '3', '1'), par('v106', '3', '2')],
        },
        {
          text: 'V budově i ve stanu musí zbýt místo na osobní věci a na pohyb mezi lůžky.',
          basis: 'law',
          cites: [par('v106', '3', '2')],
        },
        {
          text: 'Stany musí mít pevnou nepromokavou plachtu. Prostor na spaní musí být izolován od země proti vlhku a chladu, prostor na věci proti vlhku.',
          basis: 'law',
          cites: [par('v106', '3', '3')],
        },
        {
          text: 'Děti se ubytují odděleně podle pohlaví, pokud se společným ubytováním nevysloví souhlas zákonný zástupce. Dozor bydlí odděleně v blízkosti dětí.',
          basis: 'law',
          cites: [par('v106', '4', '1')],
        },
        {
          text: 'Patrová lůžka jsou pro děti **od 7 let**. Horní lůžko musí být bezpečně přístupné, se zábranou proti pádu a nepropustnou podložkou pod matrací.',
          basis: 'law',
          cites: [par('v106', '4', '2')],
        },
      ],
    },
    {
      id: 'hygiena',
      title: 'Umývárny a záchody',
      facts: [
        {
          text: 'Musí být vytvořeny podmínky pro osobní hygienu celého těla. V umývárně stačí umyvadlo s tekoucí vodou a odtokem, nebo výtokový kohout s odvodem použité vody mimo místo mytí.',
          basis: 'law',
          cites: [par('v106', '3', '4')],
        },
        {
          text: 'Děti musí mít možnost vykoupat se nebo osprchovat **v teplé vodě alespoň jednou za týden**.',
          basis: 'law',
          cites: [par('v106', '3', '4')],
        },
        {
          text: 'Pevné počty umyvadel, sprch a záchodů na počet dětí od 1. 1. 2026 neplatí. Místo nich vyhláška žádá, aby byla dětem při mytí i na záchodě **zajištěna intimita**.',
          basis: 'law',
          cites: [par('v106', '3', '4'), par('v106', '3', '5'), at('khsMsk2026')],
          since: '2026-01-01',
          change:
            'Zrušeny pevné počty umyvadel, sprch a záchodů i povinné rozdělení záchodů podle pohlaví. Zůstává požadavek na soukromí.',
        },
        {
          text: 'Záchody nemusí být rozdělené podle pohlaví. V jejich blízkosti musí být možnost umýt si ruce v tekoucí vodě.',
          basis: 'law',
          cites: [par('v106', '3', '5')],
          quote:
            'Užívání záchodů nemusí být rozděleno podle pohlaví, ale vždy musí být zajištěna intimita při jejich užívání.',
          since: '2026-01-01',
        },
      ],
    },
    {
      id: 'luzkoviny',
      title: 'Lůžkoviny',
      facts: [
        {
          text: 'Ložní prádlo se mění vždy před použitím lůžka jiným dítětem, po znečištění a po odchodu dítěte kvůli nemoci.',
          basis: 'law',
          cites: [par('v106', '4', '3')],
        },
        {
          text: 'Opakovaně používané matrace a slamníky musí být čisté a nepoškozené a lůžko s nimi musí mít vyměnitelný povlak nebo čistou textilii přes celou plochu.',
          basis: 'law',
          cites: [par('v106', '4', '3')],
          since: '2026-01-01',
        },
        {
          text: 'Čisté prádlo skladujte tak, aby se neznečistilo, použité vždy odděleně a v obalech.',
          basis: 'law',
          cites: [par('v106', '4', '3')],
        },
        {
          text: 'Vedoucí průběžně kontrolují oblečení, obuv a lůžkoviny dětí, aby nepromokly a děti neprochladly.',
          basis: 'law',
          cites: [par('v106', '8', '3')],
        },
      ],
    },
    {
      id: 'uklid',
      title: 'Úklid a odpady',
      facts: [
        {
          text: 'Všechny prostory se uklidí před zahájením tábora, mezi běhy a po skončení. Během tábora se uklízí denně.',
          basis: 'law',
          cites: [par('v106', '4', '4'), par('v106', '4', '5')],
        },
        {
          text: 'Prostory musí být čisté a bezpečné po celý den, ne jen po ranním úklidu.',
          basis: 'law',
          cites: [par('v106', '4', '5')],
          since: '2026-01-01',
          change: 'Prostory tábora musí být čisté a bezpečné po celý den, ne jen po denním úklidu.',
        },
        {
          text: 'Děti se denního úklidu účastnit mohou, pod vedením dospělých. **Záchody uklízet nesmějí.**',
          basis: 'law',
          cites: [par('v106', '4', '5')],
          quote: 'Děti však nesmějí provádět úklid záchodů.',
        },
        {
          text: 'Pevné odpady patří do uzavíratelných nádob, které lze snadno čistit a dezinfikovat, nebo do jednorázových plastových obalů, a skladují se mimo místa, kde se zachází s potravinami.',
          basis: 'law',
          cites: [par('v106', '6', '1')],
        },
      ],
    },
    {
      id: 'zimni-akce',
      title: 'Zimní tábory',
      facts: [
        {
          text: 'Budova pro zimní zotavovací akci musí mít mikroklima odpovídající pobytovým místnostem, teplou vodu pro osobní hygienu a prostory na sušení oděvů a obuvi a na sportovní potřeby.',
          basis: 'law',
          cites: [par('v106', '3', '7')],
        },
      ],
    },
  ],
  related: {
    guides: ['stravovani', 'zdravotnik-a-lekarnicka', 'rezim-dne-a-koupani'],
    documents: ['souhlasy-rodicu-na-tabor'],
  },
  verified: '2026-11-19',
} as const satisfies Guide;
