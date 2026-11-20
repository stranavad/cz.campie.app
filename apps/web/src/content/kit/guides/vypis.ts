import { at, par } from '../cite.ts';
import type { Guide } from '../types.ts';

export const vypis = {
  slug: 'vypis-z-rejstriku-trestu-pro-praci-s-detmi',
  nav: 'Výpis z rejstříku pro práci s dětmi',
  title: 'Výpis z rejstříku trestů pro práci s dětmi na táboře',
  seoTitle: 'Výpis z rejstříku trestů pro práci s dětmi na táboře (2027)',
  description:
    'Od 1. 1. 2027 musí každý, kdo působí na dětském táboře, předat pořadateli výpis z rejstříku trestů vydávaný pro práci s dětmi, ne starší než 3 měsíce. Koho se to týká a co má udělat pořadatel.',
  lead: 'Léto 2027 je první sezóna, kdy to platí. Týká se to velkých táborů i víkendových akcí.',
  summary: 'Nová povinnost od 1. 1. 2027 pro každého, kdo je na táboře činný.',
  sections: [
    {
      id: 'co-plati',
      title: 'Co od 1. 1. 2027 platí',
      facts: [
        {
          text: 'Na zotavovací akci smí být činný jen ten, kdo **nemá záznam v evidenci skutečností důležitých pro práci s dětmi**. Evidenci vede Ministerstvo spravedlnosti.',
          basis: 'law',
          cites: [par('z258from2027', '10', '4')],
          quote:
            'Fyzická osoba může být činná při škole v přírodě nebo zotavovací akci pouze tehdy, nemá-li záznam v evidenci skutečností důležitých pro práci s dětmi vedené Ministerstvem spravedlnosti.',
          since: '2027-01-01',
          change:
            'Na táboře smí působit jen ten, kdo nemá záznam v evidenci skutečností důležitých pro práci s dětmi. Každý předá pořadateli výpis z rejstříku trestů vydávaný pro práci s dětmi, ne starší než 3 měsíce.',
        },
        {
          text: 'Každý takový člověk předá pořadateli **výpis z rejstříku trestů vydávaný pro práci s dětmi, ne starší než 3 měsíce**.',
          basis: 'law',
          cites: [par('z258from2027', '10', '4')],
          quote:
            'Fyzická osoba, s výjimkou pedagogického a zdravotnického pracovníka, předá vysílající škole nebo pořádající osobě výpis z rejstříku trestů vydávaný pro práci s dětmi ne starší než 3 měsíce.',
          since: '2027-01-01',
        },
        {
          text: 'Pedagogičtí a zdravotničtí pracovníci výpis nepředávají. Zákaz působit se záznamem v evidenci ale platí i pro ně.',
          basis: 'law',
          cites: [par('z258from2027', '10', '4')],
          since: '2027-01-01',
        },
        {
          text: 'Povinnost platí i pro **jiné podobné akce**, tedy i pro tábory do 30 dětí a akce na 5 dnů a méně.',
          basis: 'law',
          cites: [par('z258from2027', '12')],
          since: '2027-01-01',
          change: 'Výpis z rejstříku pro práci s dětmi se týká i menších a kratších akcí, ne jen zotavovacích.',
          smallToo: true,
        },
        {
          text: 'Povinnost do zákona vložil zákon č. 270/2025 Sb. Přechodné období pro tábory nestanovil.',
          basis: 'law',
          cites: [at('z270', 'čl. XIX')],
          since: '2027-01-01',
        },
      ],
    },
    {
      id: 'koho-se-tyka',
      title: 'Koho se to týká',
      facts: [
        {
          text: 'Zákon mluví o každé fyzické osobě, která je na akci činná, ne jen o dozoru a zdravotníkovi jako u posudku.',
          basis: 'law',
          cites: [par('z258from2027', '10', '4'), par('z258from2027', '10', '1')],
          since: '2027-01-01',
          smallToo: true,
        },
        {
          text: 'Počítejte proto s výpisem i u lidí v kuchyni a v technickém zázemí. Kde přesně vede hranice u jednodenních hostů nebo externích lektorů, zákon neříká; v pochybnostech si výpis vyžádejte.',
          basis: 'advice',
          cites: [par('z258from2027', '10', '4')],
          smallToo: true,
        },
        {
          text: 'Junák vykládá povinnost tak, že výpis předkládá každý činovník tábora starší 15 let. Zákon sám věkovou hranici neuvádí.',
          basis: 'practice',
          cites: [at('junakTabory')],
        },
      ],
    },
    {
      id: 'co-ma-udelat-poradatel',
      title: 'Co má udělat pořadatel',
      facts: [
        {
          text: 'Řekněte lidem o výpis včas, ale ne moc brzy: v den, kdy vám ho předají, nesmí být starší než 3 měsíce. Pro červencový tábor to znamená žádat nejdřív v dubnu.',
          basis: 'advice',
          cites: [par('z258from2027', '10', '4')],
        },
        {
          text: 'Žádejte výslovně o výpis **pro práci s dětmi**. Běžný výpis z rejstříku trestů údaje z evidence skutečností důležitých pro práci s dětmi neobsahuje; ty jsou v příloze výpisu vydávaného právě pro tento účel.',
          basis: 'law',
          cites: [at('z270', 'změna zákona č. 269/1994 Sb., nový § 14a odst. 6 a 7')],
          since: '2027-01-01',
        },
        {
          text: 'Výpis není mezi dokumenty, které musíte 6 měsíců uchovávat. Protože jde o údaje o trestní minulosti, doporučujeme si výpis jen prohlédnout a zapsat si datum kontroly a datum vydání výpisu, kopie neskladovat.',
          basis: 'advice',
          cites: [par('z258from2027', '11', '1', 'e'), at('gdpr', 'čl. 5 odst. 1 písm. c) a čl. 10')],
        },
        {
          text: 'Přijetí člověka, který podmínky nesplňuje, je porušením povinnosti pořadatele zajistit účast jen způsobilých osob, s pokutou do 30 000 Kč.',
          basis: 'law',
          cites: [par('z258from2027', '11', '1', 'b'), par('z258from2027', '92d', '3', 'c')],
        },
      ],
    },
  ],
  related: {
    guides: ['vedouci-a-hlavni-vedouci', 'povinnosti-poradatele', 'osobni-udaje-a-fotografie'],
    documents: [],
  },
  verified: '2026-11-19',
} as const satisfies Guide;
