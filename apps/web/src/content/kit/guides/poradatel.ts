import { at, par } from '../cite.ts';
import type { Guide } from '../types.ts';

export const poradatel = {
  slug: 'povinnosti-poradatele',
  nav: 'Povinnosti pořadatele',
  title: 'Povinnosti pořadatele tábora',
  seoTitle: 'Povinnosti pořadatele dětského tábora: hygiena, lhůty (2027)',
  description:
    'Ohlášení zotavovací akce hygieně měsíc předem, rozbor vody, instruktáž vedoucích, dokumentace a jak dlouho ji uchovat. Přehled povinností pořadatele s odkazy na zákon.',
  lead: 'Co musí zařídit ten, kdo děti na tábor přijímá. Seřazeno podle toho, kdy to přijde na řadu.',
  summary: 'Ohlášení hygieně, voda, instruktáž, dokumentace a lhůty.',
  sections: [
    {
      id: 'ohlaseni',
      title: 'Ohlášení hygieně',
      facts: [
        {
          text: 'Zotavovací akci ohlásíte krajské hygienické stanici **jeden měsíc před zahájením**.',
          basis: 'law',
          cites: [par('z258', '8', '3')],
          quote:
            'Pořádající osoba nebo škola, která vysílá děti na školu v přírodě na dobu delší než 5 dnů, je povinna jeden měsíc před zahájením zotavovací akce nebo školy v přírodě ohlásit příslušnému orgánu ochrany veřejného zdraví',
        },
        {
          text: 'V ohlášení uvedete termín a místo (adresu nebo katastrální území a zeměpisné souřadnice), počet dětí v každém běhu s daty začátku a konce, způsob zabezpečení pitnou vodou, způsob stravování a jméno a telefon odpovědné osoby přítomné na každém běhu.',
          basis: 'law',
          cites: [par('z258', '8', '3')],
        },
        {
          text: 'Ohlásit lze písemně, datovou schránkou nebo přes veřejný webový registr na `eregpublicsecure.uzis.cz/Registr/SZD`.',
          basis: 'authority',
          cites: [at('mzdRekreace'), at('portalOhlaseni')],
        },
        {
          text: 'Formulář ohlášení najdete na webu své krajské hygienické stanice. Příslušná je stanice podle místa konání tábora.',
          basis: 'authority',
          cites: [at('portalOhlaseni')],
        },
        {
          text: 'Termín si dejte do kalendáře s rezervou: měsíc se počítá od začátku prvního běhu a pozdní ohlášení je přestupek.',
          basis: 'advice',
          cites: [par('z258', '8', '3'), par('z258', '92d', '3', 'a')],
        },
      ],
    },
    {
      id: 'voda',
      title: 'Pitná voda',
      facts: [
        {
          text: 'Pokud voda není z veřejného vodovodu nebo od jiného dodavatele pitné vody, přiložíte k ohlášení **protokol o kráceném rozboru jakosti pitné vody, ne starší než 3 měsíce**.',
          basis: 'law',
          cites: [par('z258', '8', '4')],
          quote: 'Protokol nesmí být starší než 3 měsíce.',
        },
        {
          text: 'Pitné vody musí být dost k pití, čištění zubů, vaření, mytí nádobí, čištění pracovních ploch v kuchyni, hygieně rukou lidí u stravování a k provozu ošetřovny a izolace.',
          basis: 'law',
          cites: [par('v106', '5', '1')],
          smallToo: true,
        },
        {
          text: 'Dováženou nebo donášenou vodu skladujte jen v čistých uzavíratelných nádobách určených pro pitnou vodu, označených a uložených v chladu a stínu.',
          basis: 'law',
          cites: [par('v106', '5', '2')],
          smallToo: true,
        },
        {
          text: 'Jak zajistit studnu, cisternu a rozvody na táboře krok za krokem popisuje návod Státního zdravotního ústavu, aktualizovaný v květnu 2026.',
          basis: 'authority',
          cites: [at('szuVoda')],
        },
      ],
    },
    {
      id: 'lide',
      title: 'Lidé na táboře',
      facts: [
        {
          text: 'Na táboře smí působit jen lidé, kteří splňují zákonné podmínky: zdravotní způsobilost dozoru a zdravotníka, znalosti hygieny u stravování a od roku 2027 čistý záznam pro práci s dětmi.',
          basis: 'law',
          cites: [par('z258', '11', '1', 'b'), par('z258from2027', '10')],
        },
        {
          text: 'Všem osobám činným na akci kromě zdravotníka zajistíte **instruktáž** o hygienických požadavcích, předcházení infekcím a jiným poškozením zdraví a o základech první pomoci. Kdo ji už absolvoval, znovu nemusí.',
          basis: 'law',
          cites: [par('z258', '11', '2')],
        },
        {
          text: 'Zákon nežádá o instruktáži písemný záznam. Podpisový arch s datem a obsahem je ale nejjednodušší způsob, jak ji při kontrole doložit.',
          basis: 'advice',
          cites: [par('z258', '11', '2'), par('z258', '92d', '5', 'b')],
        },
        {
          text: 'Zajistíte zdravotníka, který je dosažitelný 24 hodin denně po celou dobu akce.',
          basis: 'law',
          cites: [par('z258', '11', '1', 'a'), par('z258', '11', '1', 'b')],
        },
      ],
    },
    {
      id: 'dokumentace',
      title: 'Dokumentace a jak dlouho ji uchovat',
      facts: [
        {
          text: 'Vedete zdravotnický deník, seznam účastníků, prohlášení o bezinfekčnosti a výpisy z posudků dětí i dospělých. Tyto dokumenty uchováte **6 měsíců od skončení akce**.',
          basis: 'law',
          cites: [par('z258', '11', '1', 'e')],
          quote:
            'vedení zdravotnického deníku a seznamu účastníků, prohlášení podle § 9 odst. 3 věty páté, výpisů z posudků o zdravotní způsobilosti dětí a fyzických osob činných při škole v přírodě nebo zotavovací akci a následné uchovávání těchto dokumentů po dobu 6 měsíců od skončení školy v přírodě nebo zotavovací akce',
        },
        {
          text: 'Posudky o zdravotní způsobilosti si nenecháváte. Po skončení akce je vrátíte rodičům a vedoucím; vám zůstává jen výpis, který z nich pořídil zdravotník.',
          basis: 'law',
          cites: [par('z258', '11', '1', 'c'), par('z258', '11', '1', 'b')],
        },
        {
          text: 'Osobu, která má dítě v péči, informujete o zdravotních potížích, které dítě na táboře prodělalo, a o případném kontaktu s infekcí. Formu zákon neurčuje.',
          basis: 'law',
          cites: [par('z258', '11', '1', 'f')],
        },
        {
          text: 'Účetní doklady uchováváte 5 let, účetní závěrku 10 let. To se týká i dokladů o platbách za tábor.',
          basis: 'law',
          cites: [par('z563', '31', '2')],
          smallToo: true,
        },
      ],
    },
    {
      id: 'misto',
      title: 'Místo konání',
      facts: [
        {
          text: 'Tábor nesmí stát tam, kde lze čekat znečištění ovzduší nebo hluk nad hygienické limity, a k pozemku musí vést přístupová cesta.',
          basis: 'law',
          cites: [par('v106', '2')],
        },
        {
          text: 'V lese je zakázáno tábořit mimo vyhrazená místa a rozdělávat oheň, a to i do 50 metrů od okraje lesa. Výjimku může povolit vlastník lesa.',
          basis: 'law',
          cites: [par('z289', '20', '1', 'k'), par('z289', '20', '2'), par('z289', '20', '4')],
          smallToo: true,
        },
        {
          text: 'Organizovanou akci v lese oznámíte nejméně 30 dnů předem obecnímu úřadu obce s rozšířenou působností a potřebujete k ní písemný souhlas vlastníka lesa.',
          basis: 'law',
          cites: [par('z289', '20', '5')],
          smallToo: true,
        },
        {
          text: 'Stanový tábor do 60 dětí do 15 let nepotřebuje povolení k vypouštění odpadních vod z kuchyně a hygieny, pokud učiní opatření, aby neohrozil jakost povrchových a podzemních vod.',
          basis: 'law',
          cites: [par('z254', '8', '3', 'h')],
          smallToo: true,
        },
      ],
    },
  ],
  related: {
    guides: ['zotavovaci-akce-nebo-jina-podobna-akce', 'zdravotnik-a-lekarnicka', 'vedouci-a-hlavni-vedouci'],
    documents: ['prohlaseni-o-bezinfekcnosti', 'posudek-o-zdravotni-zpusobilosti-ditete'],
  },
  verified: '2026-11-19',
} as const satisfies Guide;
