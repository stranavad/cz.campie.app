import { at, par } from '../cite.ts';
import type { Guide } from '../types.ts';

export const zajezd = {
  slug: 'komercni-tabor-a-zajezd',
  nav: 'Komerční tábor a zájezd',
  title: 'Kdy je tábor zájezdem a potřebuje cestovní kancelář',
  seoTitle: 'Je dětský tábor zájezd? Kdy potřebujete koncesi CK (2027)',
  description:
    'Pobytový tábor pořádaný podnikatelsky může být zájezdem podle zákona č. 159/1999 Sb. Kdy to platí, koho se to netýká a jakou živnost na pořádání táborů potřebujete.',
  lead: 'Spolků se to netýká. Firmy a živnostníci, kteří prodávají pobytové tábory, by tuhle stránku měli dočíst.',
  summary: 'Past pro firmy a živnostníky: pobytový tábor jako zájezd.',
  sections: [
    {
      id: 'kdy-je-tabor-zajezd',
      title: 'Kdy je tábor zájezdem',
      facts: [
        {
          text: 'Zájezd je soubor alespoň dvou různých typů služeb cestovního ruchu pro účely téže cesty nebo pobytu. Typy služeb jsou doprava, ubytování, nájem vozidla a jiná služba cestovního ruchu.',
          basis: 'law',
          cites: [par('z159', '1b', '1'), par('z159', '1a')],
          smallToo: true,
        },
        {
          text: 'Podle Ministerstva pro místní rozvoj stačí ubytování spojené se sportovním nebo kulturním programem či výlety, pokud program tvoří alespoň 25 % ceny nebo je nabízen jako podstatná část pobytu. **Doprava součástí být nemusí.**',
          basis: 'authority',
          cites: [at('mmrZajezd'), par('z159', '1b', '2')],
          smallToo: true,
        },
        {
          text: 'Kdo takový tábor nabízí podnikatelsky, potřebuje podle ministerstva koncesi "Provozování cestovní kanceláře - pořádání zájezdů".',
          basis: 'authority',
          cites: [at('mmrZajezd')],
          smallToo: true,
        },
      ],
    },
    {
      id: 'koho-se-to-netyka',
      title: 'Koho se to netýká',
      facts: [
        {
          text: 'Zákon se nevztahuje na služby, jejichž nabízení a prodej **není činností vykonávanou podnikatelským způsobem**. To je případ spolků a dalších neziskových pořadatelů.',
          basis: 'law',
          cites: [par('z159', '1', '2')],
          quote: 'jejichž nabízení, prodej nebo zprostředkování není činností vykonávanou podnikatelským způsobem',
          smallToo: true,
        },
        {
          text: 'Nevztahuje se ani na akce kratší než 24 hodin bez noclehu. **Příměstský tábor** tedy zájezdem není.',
          basis: 'law',
          cites: [par('z159', '1', '2')],
          quote: 'na dobu kratší než 24 hodin, jestliže nezahrnují nocleh',
          smallToo: true,
        },
      ],
    },
    {
      id: 'zivnost',
      title: 'Jakou živnost na tábory',
      facts: [
        {
          text: 'Vedení dětských táborů, zajišťování programu a dohled nad dětmi spadají do volné živnosti, oboru **Mimoškolní výchova a vzdělávání, pořádání kurzů, školení, včetně lektorské činnosti**.',
          basis: 'law',
          cites: [at('nv278', 'příloha č. 4, obor 72')],
          quote:
            'výchovně vzdělávací činnost na dětských táborech a jiných zotavovacích akcích, zejména vedení těchto akcí, zajišťování výchovných, relaxačních a vzdělávacích programů pro účastníky těchto akcí, dohled nad dětmi',
          smallToo: true,
        },
        {
          text: 'Volná živnost pokrývá program a dohled. Jakmile jako podnikatel prodáváte pobyt s ubytováním a programem jako celek, řešte s úřadem nebo advokátem i otázku zájezdu dřív, než spustíte přihlášky.',
          basis: 'advice',
          cites: [at('mmrZajezd'), par('z159', '1b', '1')],
          smallToo: true,
        },
      ],
    },
  ],
  related: {
    guides: ['zotavovaci-akce-nebo-jina-podobna-akce', 'povinnosti-poradatele'],
    documents: [],
  },
  verified: '2026-11-19',
} as const satisfies Guide;
