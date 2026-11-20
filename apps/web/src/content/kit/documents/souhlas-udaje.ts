import { at, par } from '../cite.ts';
import type { DocumentTemplate } from './types.ts';

export const souhlasUdaje = {
  slug: 'souhlas-se-zpracovanim-osobnich-udaju',
  seoTitle: 'Souhlas s fotografováním dětí na táboře - vzor GDPR 2027 (PDF)',
  description:
    'Vzor souhlasu se zpracováním osobních údajů pro dětský tábor: fotografie v galerii pro rodiče, na webu a sociálních sítích, každý souhlas zvlášť. S logem a údaji vašeho tábora, PDF ke stažení.',
  pageTitle: 'Souhlas s fotografiemi a zpracováním osobních údajů',
  lead: 'Jen to, k čemu souhlas opravdu potřebujete, a každý účel zvlášť. Přihláška, zdravotní dokumenty ani kontakty sem nepatří.',
  title: 'Souhlas se zpracováním osobních údajů',
  subtitle: 'podle čl. 6 odst. 1 písm. a) a čl. 7 nařízení (EU) 2016/679 (GDPR)',
  kind: 'template',
  before: [
    { type: 'event', blankWhenEmpty: false },
    {
      type: 'fields',
      fields: [
        { label: 'Jméno a příjmení dítěte', width: 'full' },
        { label: 'Jméno a příjmení zákonného zástupce', width: 'full' },
      ],
    },
    {
      type: 'paragraph',
      text: 'Tento souhlas je **dobrovolný**. Každý bod můžete udělit nebo odmítnout zvlášť a účast dítěte na táboře na něm nezávisí. Údaje potřebné pro přihlášku a pobyt zpracovává pořadatel bez souhlasu, na základě smlouvy a právních předpisů; informaci o tomto zpracování jste dostali s přihláškou.',
    },
  ],
  items: [
    {
      id: 'galerie-pro-rodice',
      title: 'Fotografie a videa v galerii pro rodiče',
      text: 'Účel: průběžné informování rodičů o dění na táboře.\nKde: galerie nebo skupina přístupná jen rodičům účastníků tohoto tábora.\nDoba: nejdéle jeden rok od skončení tábora.',
      kind: 'choice',
      defaultOn: true,
      why: {
        text: 'Situační fotky z akce mohou podle úřadu stát i na oprávněném zájmu. U dětí je ale souhlas jistější a uzavřená galerie je účel, se kterým rodiče souhlasí nejsnáz. Proto ho držte odděleně od zveřejnění.',
        basis: 'authority',
        cites: [at('uoouSkolstvi'), par('oz', '84')],
      },
    },
    {
      id: 'web-a-socialni-site',
      title: 'Fotografie a videa na webu a sociálních sítích pořadatele',
      text: 'Účel: propagace činnosti pořadatele.\nKde: webové stránky pořadatele a jeho profily na sociálních sítích.\nDoba: nejdéle tři roky od pořízení.',
      kind: 'choice',
      defaultOn: true,
      why: {
        text: 'U sociálních sítí úřad kvůli riziku dalšího šíření fotografií oprávněný zájem zpravidla neuznává. Tady souhlas potřebujete.',
        basis: 'authority',
        cites: [at('uoouSkolstvi'), par('oz', '85')],
      },
    },
    {
      id: 'tisk-a-partneri',
      title: 'Předání fotografií tisku a partnerům',
      text: 'Účel: informování veřejnosti o táboře.\nKde: tisk, zpravodajské weby a materiály partnerů pořadatele, vždy ve spojení s táborem.\nDoba: po dobu spolupráce, nejdéle tři roky od pořízení.',
      kind: 'choice',
      defaultOn: false,
      why: {
        text: 'Předání fotografií dalšímu subjektu je nový příjemce údajů a nové šíření podobizny. Zapněte jen tehdy, když s tiskem nebo partnery opravdu spolupracujete.',
        basis: 'law',
        cites: [par('oz', '85'), at('gdpr', 'čl. 13 odst. 1 písm. e)')],
      },
    },
    {
      id: 'jmeno-u-fotografii',
      title: 'Jméno dítěte u fotografií a výsledků',
      text: 'Účel: uvedení jména a příjmení dítěte u fotografií a ve výsledcích táborových soutěží.\nKde: galerie pro rodiče.\nDoba: nejdéle jeden rok od skončení tábora.',
      kind: 'choice',
      defaultOn: false,
      why: {
        text: 'Spojení fotografie se jménem zvyšuje podle úřadu rizika pro dítě. Pokud jména nezveřejňujete, bod nechte vypnutý.',
        basis: 'authority',
        cites: [at('uoouSkolstvi')],
      },
    },
    {
      id: 'rodne-cislo',
      title: 'Rodné číslo pro potvrzení o účasti',
      text: 'Souhlasím, aby pořadatel využil rodné číslo dítěte, které jsem mu sdělil(a), výhradně k vystavení potvrzení o účasti pro zdravotní pojišťovnu nebo zaměstnavatele.',
      kind: 'choice',
      defaultOn: false,
      why: {
        text: 'Rodné číslo smíte využívat jen se souhlasem, zvláštní zákon vám ho pro tábor neukládá. Zapněte, pokud ho pro potvrzení pojišťovnám sbíráte.',
        basis: 'law',
        cites: [par('z133', '13c', '1', 'd')],
      },
    },
  ],
  after: [
    {
      type: 'paragraph',
      text: 'Souhlas můžete kdykoli odvolat, stejně snadno, jako jste ho udělili: e-mailem nebo písemně na kontakt pořadatele. Odvolání se nedotkne zpracování, které proběhlo před ním. Máte právo na přístup k údajům, na jejich opravu, výmaz a omezení zpracování a právo podat stížnost u Úřadu pro ochranu osobních údajů (uoou.gov.cz).',
    },
    { type: 'signature', signers: ['Podpis zákonného zástupce'] },
  ],
  explain: {
    title: 'Co k souhlasu říká zákon',
    sections: [
      { guide: 'osobni-udaje-a-fotografie', section: 'pravni-zaklady' },
      { guide: 'osobni-udaje-a-fotografie', section: 'platny-souhlas' },
      { guide: 'osobni-udaje-a-fotografie', section: 'fotografie' },
    ],
    answer: { section: { guide: 'osobni-udaje-a-fotografie', id: 'pravni-zaklady' }, index: 0 },
    facts: [
      {
        text: 'Vzor neobsahuje souhlas se zpracováním údajů z přihlášky ani zdravotních dokumentů. Ty zpracováváte na základě smlouvy a zákona a souhlas k nim úřad označuje za chybu.',
        basis: 'authority',
        cites: [at('uoouSouhlas'), at('uoouSpolky')],
      },
      {
        text: 'U každého bodu je účel, místo a doba. Bez nich souhlas není konkrétní ani informovaný.',
        basis: 'law',
        cites: [at('gdpr', 'čl. 4 bod 11')],
      },
      {
        text: 'Vedle souhlasu potřebujete ještě informaci o zpracování osobních údajů podle čl. 13. Vzor na ni odkazuje; sama je jiný dokument a rodič ji nepodepisuje.',
        basis: 'law',
        cites: [at('gdpr', 'čl. 13')],
      },
    ],
  },
  inCampie:
    'V Campie rodič každý bod odklikne zvlášť z mobilu a kdykoli ho může odvolat. Vy máte u každého dítěte přehled, co smíte zveřejnit, a podepsané PDF k tomu.',
  related: {
    guides: ['osobni-udaje-a-fotografie'],
    documents: ['souhlasy-rodicu-na-tabor', 'prohlaseni-o-bezinfekcnosti'],
  },
  verified: '2026-11-19',
} as const satisfies DocumentTemplate;
