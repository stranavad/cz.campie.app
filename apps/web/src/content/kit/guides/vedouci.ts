import { at, par } from '../cite.ts';
import type { Guide } from '../types.ts';

export const vedouci = {
  slug: 'vedouci-a-hlavni-vedouci',
  nav: 'Vedoucí a hlavní vedoucí',
  title: 'Vedoucí, instruktoři a hlavní vedoucí',
  seoTitle: 'Vedoucí na táboře: věk, kvalifikace a co žádá zákon (2027)',
  description:
    'Kolik let musí být vedoucímu, kolik dětí smí mít na starosti a jestli hlavní vedoucí potřebuje kurz. Co stanoví zákon, co je jen podmínka dotace a co doporučení.',
  lead: 'O vedoucích koluje hodně pravidel, která v zákoně nenajdete. Tady je rozdělené, co je povinnost a co zvyk.',
  summary: 'Zdravotní způsobilost, výpis z rejstříku a mýty o věku a počtech.',
  sections: [
    {
      id: 'co-zakon-zada',
      title: 'Co zákon po vedoucích žádá',
      facts: [
        {
          text: 'Kdo na táboře působí jako dozor nebo zdravotník, musí být k této činnosti **zdravotně způsobilý**.',
          basis: 'law',
          cites: [par('z258', '10', '1')],
          smallToo: true,
        },
        {
          text: 'Způsobilost potvrzuje posudek registrujícího praktického lékaře, praktického lékaře pro děti a dorost nebo pediatra.',
          basis: 'law',
          cites: [par('z258', '10', '2')],
        },
        {
          text: 'Posudek vedoucího už **nemá omezenou platnost**. Od 1. 1. 2026 platí do doby, než se zdravotní způsobilost změní. Dříve platil dva roky.',
          basis: 'law',
          cites: [par('z258', '10', '2'), at('z290')],
          quote: 'Tento posudek má platnost do doby, dokud nedošlo ke změně zdravotní způsobilosti fyzické osoby.',
          since: '2026-01-01',
          change:
            'Posudek o zdravotní způsobilosti vedoucích a zdravotníka už nemá omezenou platnost. Platí, dokud se zdravotní způsobilost nezmění.',
        },
        {
          text: 'Pedagogičtí a zdravotničtí pracovníci posudek pořadateli nepředávají.',
          basis: 'law',
          cites: [par('z258', '10', '2')],
        },
        {
          text: 'Každý kromě zdravotníka musí projít instruktáží o hygieně, předcházení infekcím a základech první pomoci, pokud ji už neabsolvoval dříve.',
          basis: 'law',
          cites: [par('z258', '11', '2')],
        },
        {
          text: 'Od 1. 1. 2027 nesmí mít nikdo činný na táboře záznam v evidenci skutečností důležitých pro práci s dětmi a pořadateli předá výpis z rejstříku trestů vydávaný pro práci s dětmi. Podrobně v samostatném průvodci.',
          basis: 'law',
          cites: [par('z258from2027', '10', '4')],
          since: '2027-01-01',
          smallToo: true,
        },
        {
          text: 'Na koupání smí dohlížet jen ten, kdo je schopen poskytnout záchranu tonoucímu.',
          basis: 'law',
          cites: [par('v106', '8', '4')],
        },
      ],
    },
    {
      id: 'co-zakon-nerika',
      title: 'Co v zákoně nenajdete',
      intro:
        'Zákon o ochraně veřejného zdraví ani vyhláška č. 106/2001 Sb. tyto věci neupravují. Pokud je po vás někdo žádá, opírá se o vlastní pravidla, ne o zákon.',
      facts: [
        {
          text: '**Minimální věk vedoucího ani instruktora** zákon nestanoví. Podmínky pro osoby činné na akci jsou jen zdravotní způsobilost, instruktáž a od roku 2027 čistý záznam.',
          basis: 'law',
          cites: [par('z258', '10'), par('z258', '11', '2')],
        },
        {
          text: '**Počet dětí na jednoho vedoucího** zákon ani vyhláška neurčují.',
          basis: 'law',
          cites: [par('z258', '10'), par('v106', '8')],
        },
        {
          text: 'Pojem **hlavní vedoucí** zákon nezná. Žádá jen, abyste v ohlášení uvedli odpovědnou osobu přítomnou na každém běhu a telefon na ni.',
          basis: 'law',
          cites: [par('z258', '8', '3', 'e')],
        },
        {
          text: 'Odpovědnost za děti ale zákon zná. Kdo zanedbá náležitý dohled nad dítětem mladším 13 let, nahradí škodu, kterou dítě způsobilo. Počet a zkušenost vedoucích proto volte tak, abyste dohled uhájili.',
          basis: 'advice',
          cites: [par('oz', '2920', '3'), par('oz', '2921')],
        },
        {
          text: 'Junák vyžaduje, aby tábor vedl zletilý vůdce s vůdcovskou zkouškou a zdravotníkovi bylo 18 let. Je to vnitřní pravidlo organizace, dobrý vzor i pro ostatní.',
          basis: 'practice',
          cites: [at('junakTabory')],
        },
      ],
    },
    {
      id: 'kurz-hlavniho-vedouciho',
      title: 'Kurz hlavního vedoucího',
      facts: [
        {
          text: 'Osvědčení hlavního vedoucího je **podmínka dotace MŠMT**, ne zákonná povinnost. Neziskové organizace, které na tábor čerpají dotaci, musí mít hlavního vedoucího s osvědčením ze základního vzdělávacího kurzu nebo s profesní kvalifikací Hlavní vedoucí zotavovacích akcí dětí a mládeže.',
          basis: 'authority',
          cites: [at('msmtFaq')],
        },
        {
          text: 'Starší osvědčení zůstávají platná a není nutné je obnovovat.',
          basis: 'authority',
          cites: [at('msmtFaq')],
        },
      ],
    },
    {
      id: 'pracovni-volno',
      title: 'Volno ze zaměstnání',
      facts: [
        {
          text: 'Vedoucím táborů, jejich zástupcům, oddílovým vedoucím, vychovatelům, instruktorům a zdravotníkům přísluší pracovní volno v nezbytně nutném rozsahu, **nejvýše 3 týdny v kalendářním roce**.',
          basis: 'law',
          cites: [par('zp', '203a', '1')],
          smallToo: true,
        },
        {
          text: 'Podmínkou je, že tomu nebrání vážné provozní důvody zaměstnavatele a že zaměstnanec nejméně rok předtím soustavně a bezplatně pracoval s dětmi nebo mládeží.',
          basis: 'law',
          cites: [par('zp', '203a', '2')],
          smallToo: true,
        },
        {
          text: 'Náhrada mzdy přísluší, pokud tábor pořádá právnická osoba zapsaná ve veřejném rejstříku nejméně 5 let, u které práce s dětmi a mládeží tvoří podstatnou část hlavní činnosti. Zaměstnanec to zaměstnavateli prokazuje, proto mu vystavte potvrzení.',
          basis: 'law',
          cites: [par('zp', '203a', '3')],
          smallToo: true,
        },
      ],
    },
  ],
  related: {
    guides: ['vypis-z-rejstriku-trestu-pro-praci-s-detmi', 'zdravotnik-a-lekarnicka', 'rezim-dne-a-koupani'],
    documents: [],
  },
  verified: '2026-11-19',
} as const satisfies Guide;
