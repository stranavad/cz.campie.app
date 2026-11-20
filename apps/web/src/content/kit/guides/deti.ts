import { at, par } from '../cite.ts';
import type { Guide } from '../types.ts';

export const deti = {
  slug: 'podminky-ucasti-deti',
  nav: 'Podmínky účasti dětí',
  title: 'Co musí mít dítě, aby mohlo na tábor',
  seoTitle: 'Posudek a bezinfekčnost: co musí mít dítě na tábor (2027)',
  description:
    'Posudek o zdravotní způsobilosti dítěte platí dva roky, prohlášení o bezinfekčnosti nesmí být starší než jeden den. Co přesně zákon žádá, kdo co podepisuje a co s dokumenty po táboře.',
  lead: 'Na zotavovací akci smíte přijmout jen dítě, které splňuje čtyři podmínky. Dvě potvrzuje lékař, dvě rodič.',
  summary: 'Posudek od lékaře, očkování a prohlášení o bezinfekčnosti.',
  sections: [
    {
      id: 'ctyri-podminky',
      title: 'Čtyři podmínky',
      facts: [
        {
          text: 'Dítě musí být **zdravotně způsobilé** k účasti, nesmí jevit **známky akutního onemocnění** (například horečky nebo průjmu) a ve 14 kalendářních dnech před odjezdem nesmělo přijít do styku s infekčně nemocným nebo z nákazy podezřelým člověkem, ani mít nařízenou karanténu.',
          basis: 'law',
          cites: [par('z258', '9', '1')],
        },
        {
          text: 'Na zotavovací akci navíc platí čtvrtá podmínka: dítě se podrobilo stanoveným pravidelným očkováním, nebo má doklad, že je proti nákaze imunní nebo že se očkovat nemůže pro kontraindikaci.',
          basis: 'law',
          cites: [par('z258', '9', '2')],
        },
        {
          text: 'Přijetí dítěte, které podmínky nesplňuje nebo je nedoložilo, je přestupek pořadatele s pokutou do 30 000 Kč.',
          basis: 'law',
          cites: [par('z258', '92d', '3', 'b'), par('z258', '92d', '8')],
        },
      ],
    },
    {
      id: 'posudek',
      title: 'Posudek o zdravotní způsobilosti',
      facts: [
        {
          text: 'Posudek vydává registrující praktický lékař pro děti a dorost. Nemá-li dítě registrujícího lékaře, vydá ho jiný poskytovatel v tomto oboru.',
          basis: 'law',
          cites: [par('z258', '9', '3')],
        },
        {
          text: 'Posudek **platí dva roky od data vystavení**, pokud se během té doby zdravotní způsobilost dítěte nezměnila. Jeden posudek tak obvykle vystačí na dvě letní sezóny.',
          basis: 'law',
          cites: [par('z258', '9', '3')],
          quote:
            'Posudek o zdravotní způsobilosti dítěte má platnost po dobu dvou let od data vystavení, pokud během této doby nedošlo ke změně zdravotní způsobilosti dítěte.',
        },
        {
          text: 'Lékař v posudku pro zotavovací akci uvede i to, zda je dítě očkované, imunní, nebo má kontraindikaci. Samostatný doklad o očkování proto nepotřebujete.',
          basis: 'law',
          cites: [par('z258', '9', '3')],
        },
        {
          text: 'Vzor posudku je přílohou vyhlášky a **od 1. 1. 2026 je nový**. Obsahuje i alergie a dlouhodobě užívané léky. Rodné číslo dítěte v něm není, jen datum narození.',
          basis: 'law',
          cites: [at('v106', 'příloha č. 3'), at('v400')],
          since: '2026-01-01',
          change:
            'Posudek o zdravotní způsobilosti dítěte má nový vzor. Formuláře z dřívějších let vyhlášce neodpovídají.',
        },
        {
          text: 'Posudek po skončení tábora vracíte rodičům. Junák svým vedoucím doporučuje brát si od rodičů rovnou kopii a originál nechat doma.',
          basis: 'practice',
          cites: [at('junakTabory'), par('z258', '11', '1', 'c')],
        },
      ],
    },
    {
      id: 'bezinfekcnost',
      title: 'Prohlášení o bezinfekčnosti',
      facts: [
        {
          text: 'Že dítě nejeví známky akutního onemocnění a nebylo v posledních 14 dnech v kontaktu s infekcí, potvrzuje **písemné prohlášení zákonného zástupce**. Zákon mu název nedává, "bezinfekčnost" je vžité označení.',
          basis: 'law',
          cites: [par('z258', '9', '3')],
        },
        {
          text: 'Prohlášení **nesmí být starší než jeden den**. Rodič ho tedy podepisuje v den odjezdu nebo den předem.',
          basis: 'law',
          cites: [par('z258', '9', '3')],
          quote:
            'Skutečnosti uvedené v odstavci 1 písm. b) a c) potvrzuje v písemném prohlášení zákonný zástupce dítěte nebo fyzická osoba, kterou k tomu zákonný zástupce dítěte písemně zmocnil; toto potvrzení nesmí být starší než jeden den.',
        },
        {
          text: 'Místo rodiče může prohlášení podepsat a dítě předat i jiná osoba, třeba prarodič. Potřebuje k tomu **písemné zmocnění** od zákonného zástupce.',
          basis: 'law',
          cites: [par('z258', '9', '3')],
        },
        {
          text: 'Úřední formulář prohlášení neexistuje. Povinný obsah jsou jen dvě skutečnosti z § 9 odst. 1 písm. b) a c); cokoli navíc je na pořadateli.',
          basis: 'law',
          cites: [par('z258', '9', '3'), par('z258', '9', '1')],
        },
        {
          text: 'Prohlášení uchováte 6 měsíců po skončení tábora.',
          basis: 'law',
          cites: [par('z258', '11', '1', 'e')],
        },
        {
          text: 'Dospělí prohlášení o bezinfekčnosti ze zákona nepodepisují. Paragraf 10 po nich žádá posudek o zdravotní způsobilosti, ne prohlášení.',
          basis: 'law',
          cites: [par('z258', '10', '1'), par('z258', '10', '2')],
        },
      ],
    },
    {
      id: 'prevzeti',
      title: 'Převzetí dokumentů při nástupu',
      facts: [
        {
          text: 'Posudek i prohlášení předává pořadateli zákonný zástupce nebo jím písemně zmocněná osoba. U převzetí má být zdravotník.',
          basis: 'law',
          cites: [par('z258', '9', '3'), par('z258', '11', '1', 'b')],
        },
        {
          text: 'Zdravotník z posudků pořídí výpis: závěr posudku a kdo ho vydal. S výpisem pak pracuje po celý tábor.',
          basis: 'law',
          cites: [par('z258', '11', '1', 'b')],
        },
        {
          text: 'Chlapce a dívky ubytujete odděleně. Společné ubytování je možné jen se souhlasem zákonného zástupce dítěte.',
          basis: 'law',
          cites: [par('v106', '4', '1')],
        },
      ],
    },
  ],
  related: {
    guides: ['zdravotnik-a-lekarnicka', 'povinnosti-poradatele', 'osobni-udaje-a-fotografie'],
    documents: ['posudek-o-zdravotni-zpusobilosti-ditete', 'prohlaseni-o-bezinfekcnosti', 'souhlasy-rodicu-na-tabor'],
  },
  verified: '2026-11-19',
} as const satisfies Guide;
