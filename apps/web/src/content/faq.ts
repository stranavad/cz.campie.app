import type { FaqItem } from './types.ts';

// "Časté otázky" on the home page, also published as the FAQPage in its JSON-LD.
export const faq = [
  { question: 'Kolik to stojí?', answer: 'V pilotní sezóně 2027 zdarma.' },
  {
    question: 'Musíme mít platební bránu?',
    answer: 'Ne. Převod s QR kódem funguje vždy. Platby kartou zapnete, pokud máte vlastní bránu Comgate.',
  },
  {
    question: 'Jak dlouho trvá nastavení?',
    answer: 'Typický tábor to zvládne za odpoledne. Začnete z hotové přihlášky a jen upravíte, co potřebujete.',
  },
  {
    question: 'Máme víc turnusů a dva různé tábory. Jde to?',
    answer: 'Ano. Každý turnus má vlastní termín, kapacitu a ceník, každý tábor vlastní přihlášku.',
  },
  {
    question: 'Co když rodič nemá e-mail nebo přinese papír?',
    answer: 'Přihlášku založíte za něj a papírový dokument označíte jako odevzdaný.',
  },
  {
    question: 'Kde jsou data dětí a kdo je vidí?',
    answer:
      'Jen vy a lidé, které pozvete. Citlivé údaje jsou šifrované. Podrobnosti na stránce [Bezpečnost a data](/bezpecnost).',
  },
  { question: 'Můžeme od Campie odejít?', answer: 'Kdykoli. Data si stáhnete v Excelu.' },
  {
    question: 'Umíte náhradníky?',
    answer: 'Zatím ne. Plný turnus se zavře a další dítě můžete přidat ručně.',
  },
] as const satisfies readonly FaqItem[];
