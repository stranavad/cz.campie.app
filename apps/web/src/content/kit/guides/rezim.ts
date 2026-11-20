import { par } from '../cite.ts';
import type { Guide } from '../types.ts';

export const rezim = {
  slug: 'rezim-dne-a-koupani',
  nav: 'Režim dne a koupání',
  title: 'Režim dne, zátěž a koupání',
  seoTitle: 'Režim dne a koupání na dětském táboře: pravidla (2027)',
  description:
    'Kolik hodin spánku musí mít děti na táboře, kdy má být odpočinkový den a za jakých podmínek se smějí koupat. Požadavky vyhlášky č. 106/2001 Sb. na režim dne.',
  lead: 'Program si píšete sami. Vyhláška do něj mluví jen na pár místech, zato konkrétně.',
  summary: 'Spánek, odpočinkový den, fyzická zátěž a dohled u vody.',
  sections: [
    {
      id: 'rezim-dne',
      title: 'Režim dne',
      facts: [
        {
          text: 'V režimu dne musí být vymezena doba na spánek, osobní hygienu a stravování.',
          basis: 'law',
          cites: [par('v106', '8', '1')],
        },
        {
          text: 'Na spánek musí být **nejméně 9 hodin pro děti do 10 let včetně a 8 hodin pro starší**.',
          basis: 'law',
          cites: [par('v106', '8', '1')],
          quote:
            'Doba vymezená pro spánek musí činit nejméně 9 hodin pro děti do 10 let včetně a 8 hodin pro děti starší.',
        },
        {
          text: 'Noční hra tedy znamená posunout budíček. Osm nebo devět hodin se počítá i ten den.',
          basis: 'advice',
          cites: [par('v106', '8', '1')],
        },
        {
          text: 'Na sestavení režimu dne se podílí zdravotník.',
          basis: 'law',
          cites: [par('z258', '11', '1', 'b')],
        },
      ],
    },
    {
      id: 'zatez',
      title: 'Fyzická a psychická zátěž',
      facts: [
        {
          text: 'Zátěž dětí musí být přiměřená jejich věku, schopnostem a možnostem.',
          basis: 'law',
          cites: [par('v106', '8', '2')],
        },
        {
          text: 'Když první dva dny tábora děti soustavně fyzicky zatěžujete, **třetí den musí být odpočinkový**.',
          basis: 'law',
          cites: [par('v106', '8', '2')],
          quote:
            'Při soustavné fyzické zátěži dětí v prvních dvou dnech zotavovací akce musí být třetí den vyhrazen odpočinku.',
        },
        {
          text: 'Na putovním táboře se den odpočinku stanoví podle zdatnosti a aktuálního zdravotního stavu dětí.',
          basis: 'law',
          cites: [par('v106', '8', '2')],
        },
        {
          text: 'Na zimním táboře nesmí výcvik nebo jiná soustavná fyzická zátěž přesáhnout 6 hodin denně.',
          basis: 'law',
          cites: [par('v106', '8', '5')],
        },
      ],
    },
    {
      id: 'koupani',
      title: 'Koupání',
      facts: [
        {
          text: 'Děti se smějí koupat **jen pod dohledem** osoby činné na táboře jako dozor, a to takové, která je schopna poskytnout záchranu tonoucímu.',
          basis: 'law',
          cites: [par('v106', '8', '4')],
          quote:
            'Děti se mohou koupat jen za dohledu osoby činné při zotavovací akci jako dozor. Dohled může vykonávat jen osoba, která je schopna poskytnout záchranu tonoucímu.',
        },
        {
          text: 'Koupat se smějí nejdříve **hodinu po hlavním jídle** nebo po intenzivním cvičení.',
          basis: 'law',
          cites: [par('v106', '8', '4')],
        },
        {
          text: 'Koupání musí odpovídat počasí, fyzické zdatnosti dětí a jejich plaveckým schopnostem.',
          basis: 'law',
          cites: [par('v106', '8', '4')],
        },
        {
          text: 'Souhlas rodičů s koupáním vyhláška nežádá a pravidla dohledu platí bez ohledu na něj. Užitečnější je zeptat se v přihlášce, zda je dítě plavec.',
          basis: 'advice',
          cites: [par('v106', '8', '4')],
        },
      ],
    },
  ],
  related: {
    guides: ['vedouci-a-hlavni-vedouci', 'ubytovani-a-hygiena', 'zdravotnik-a-lekarnicka'],
    documents: ['souhlasy-rodicu-na-tabor'],
  },
  verified: '2026-11-19',
} as const satisfies Guide;
