import { at, par } from '../cite.ts';
import type { Guide } from '../types.ts';

export const stravovani = {
  slug: 'stravovani',
  nav: 'Stravování',
  title: 'Táborová kuchyně a stravování',
  seoTitle: 'Stravování na dětském táboře: kuchyně a jídelníček (2027)',
  description:
    'Pět jídel denně, teplý nápoj k snídani, kdo smí vařit a jestli potřebuje zdravotní průkaz. Hygienické požadavky na táborovou kuchyni podle vyhlášky č. 106/2001 Sb. po novele 2026.',
  lead: 'Zdravotní průkaz už kuchař nepotřebuje a seznam zakázaných potravin z vyhlášky zmizel. Odpovědnost za to, co se uvaří, zůstala.',
  summary: 'Kdo smí vařit, co musí být na jídelníčku a jak má vypadat kuchyně.',
  sections: [
    {
      id: 'lide',
      title: 'Kdo smí vařit',
      facts: [
        {
          text: 'Lidé činní při stravování musí mít **znalosti nutné k ochraně veřejného zdraví** a dodržovat zásady osobní a provozní hygieny. Hygienická stanice si znalosti může na místě prověřit.',
          basis: 'law',
          cites: [par('z258', '10', '3'), par('z258', '19', '2')],
          smallToo: true,
        },
        {
          text: '**Zdravotní průkaz byl zrušen** k 1. 7. 2023. Po kuchařích ani pomocnících ho nežádejte.',
          basis: 'law',
          cites: [at('z167'), par('z258', '19', '2')],
          smallToo: true,
        },
        {
          text: 'Rozsah požadovaných znalostí stanoví vyhláška č. 490/2000 Sb.',
          basis: 'law',
          cites: [at('v490')],
          smallToo: true,
        },
        {
          text: 'Osobní hygienu lidí v kuchyni kontroluje zdravotník.',
          basis: 'law',
          cites: [par('z258', '11', '1', 'a')],
        },
        {
          text: '**Děti se mohou podílet na přípravě a výdeji stravy** na jakkoli velkém táboře. Jejich zdravotní stav předtím posoudí zdravotník.',
          basis: 'law',
          cites: [par('v106', '7', '7'), at('khsMsk2026')],
          quote:
            'Děti se mohou podílet na přípravě a výdeji stravy. Zdravotní stav dětí, které se podílejí na přípravě a výdeji stravy, musí být posouzen zdravotníkem.',
          since: '2026-01-01',
          change:
            'Děti smějí pomáhat s přípravou a výdejem jídla na jakkoli velkém táboře, pokud jejich zdravotní stav posoudil zdravotník.',
        },
      ],
    },
    {
      id: 'jidelnicek',
      title: 'Jídelníček',
      facts: [
        {
          text: 'Denně musí děti dostat **snídani, přesnídávku, oběd, svačinu a večeři**. Vydat lze snídani spolu s přesnídávkou a oběd spolu se svačinou.',
          basis: 'law',
          cites: [par('v106', '7', '5')],
        },
        {
          text: 'Součástí snídaně musí být teplý nápoj a jedno z hlavních jídel dne musí být teplé.',
          basis: 'law',
          cites: [par('v106', '7', '5')],
        },
        {
          text: 'Strava musí odpovídat věku dětí a jejich fyzické zátěži. Na sestavování jídelního lístku se podílí zdravotník.',
          basis: 'law',
          cites: [par('v106', '7', '5')],
        },
        {
          text: 'Nápoje musí být k dispozici po celý den, v krytých nádobách s výpustným kohoutem nebo přímo z originálních balení.',
          basis: 'law',
          cites: [par('v106', '7', '6')],
        },
      ],
    },
    {
      id: 'potraviny',
      title: 'Potraviny',
      facts: [
        {
          text: 'Vyjmenovaný seznam zakázaných potravin už vyhláška neobsahuje. Příloha č. 1 má tři obecná pravidla: nepodávat nic, co může být zdravotně závadné, vařit podle správné výrobní praxe a potraviny, které nejde skladovat podle pokynů výrobce, hned po nákupu tepelně zpracovat nebo vydat.',
          basis: 'law',
          cites: [at('v106', 'příloha č. 1')],
          quote:
            'Potraviny, které nelze skladovat podle podmínek výrobce nebo požadavků zvláštního právního předpisu, musí být bezprostředně po zakoupení tepelně zpracovány (například zmrazená zelenina, maso) nebo ihned vydány ke konzumaci.',
        },
        {
          text: 'Potraviny skladujte za podmínek stanovených výrobcem. Skladované potraviny a pokrmy se nesmějí navzájem ovlivňovat.',
          basis: 'law',
          cites: [par('v106', '7', '4')],
        },
        {
          text: 'Bez lednice to znamená nakupovat maso, mléčné výrobky a uzeniny v den spotřeby. Je to nejčastější praktický důsledek třetího pravidla přílohy.',
          basis: 'advice',
          cites: [at('v106', 'příloha č. 1 bod 3')],
        },
      ],
    },
    {
      id: 'kuchyne',
      title: 'Kuchyně a nádobí',
      facts: [
        {
          text: 'Prostory pro stravování kromě ohniště musí být zastřešené a chráněné před vnějšími vlivy. Musí mít místo na přípravu pokrmů, na jídlo, na mytí kuchyňského nádobí a na skladování potravin.',
          basis: 'law',
          cites: [par('v106', '7', '1')],
        },
        {
          text: 'Při přípravě se nesmějí křížit čisté a nečisté činnosti. Pracovní plochy musí být označené a oddělené tak, aby se potraviny nekontaminovaly.',
          basis: 'law',
          cites: [par('v106', '7', '1'), par('v106', '7', '2')],
        },
        {
          text: 'Kuchyňské a jídelní nádobí se myje odděleně.',
          basis: 'law',
          cites: [par('v106', '7', '3')],
        },
        {
          text: '**Poslední oplach** jídelního nádobí i vlastních ešusů dětí musí být pod tekoucí pitnou vodou.',
          basis: 'law',
          cites: [par('v106', '7', '3'), at('khsMsk2026')],
          quote:
            'Poslední oplach jídelního nádobí a vlastního nádobí dětí, určených k opakovanému použití, musí být prováděn pod tekoucí pitnou vodou.',
          since: '2026-01-01',
          change: 'Poslední oplach nádobí, i vlastních ešusů dětí, musí být pod tekoucí pitnou vodou.',
        },
        {
          text: 'Pravidla pro skladování potravin, jídelníček a nápoje platí i tehdy, když jídlo odebíráte z restaurace nebo jiné provozovny.',
          basis: 'law',
          cites: [par('v106', '7', '8')],
        },
      ],
    },
  ],
  related: {
    guides: ['ubytovani-a-hygiena', 'zdravotnik-a-lekarnicka', 'povinnosti-poradatele'],
    documents: [],
  },
  verified: '2026-11-19',
} as const satisfies Guide;
