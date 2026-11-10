import { faq } from './faq.ts';
import type { Cta } from './types.ts';

// The home page, section by section. Demo values inside the illustrations (names, prices, dates) live in
// the illustration components, not here.
export const home = {
  hero: {
    titleLines: ['Méně papírování,', 'více tábora.'],
    lead: 'Přihlášky, platby, souhlasy a dokumenty na jednom místě. Rodiče všechno vyřídí z mobilu, vy máte přehled a klid.',
    primary: { label: 'Založit tábor zdarma', href: 'app:/registrace-organizace' } satisfies Cta,
    secondary: { label: 'Podívat se, jak to vidí rodič', href: '/#rodice' } satisfies Cta,
    checklistLabel: 'Ukázka: co ještě zbývá u jednoho dítěte, chybí potvrzení od lékaře',
    adminLabel: 'Ukázka: přehled turnusu v administraci tábora',
    phoneLabel: 'Ukázka: stránka tábora s výběrem turnusu na mobilu rodiče',
  },

  pains: {
    title: 'Znáte to?',
    items: [
      'Excel s přihláškami, který má tři verze a nikdo neví, která platí.',
      'Večery nad výpisem z účtu: kdo zaplatil, kdo zálohu a kdo zapomněl variabilní symbol.',
      'Souhlas s focením někde v e-mailu z března.',
      'Ráno u autobusu chybí tři bezinfekčnosti a jeden posudek.',
    ],
    closing: 'Campie tohle všechno hlídá za vás.',
  },

  year: {
    eyebrow: '01 / Rok tábora s Campie',
    title: 'Od prvních přihlášek po čistý stůl',
    plannedLabel: 'Chystáme',
    steps: [
      {
        season: 'Zima',
        title: 'Otevřete přihlášky',
        text: 'Nastavíte turnusy, ceny a formulář.',
        illustration: { kind: 'open', label: 'Ilustrace: přihlášky otevřené, tři turnusy' },
      },
      {
        season: 'Jaro',
        title: 'Platby chodí rovnou vám',
        text: 'Rodič platí QR kódem nebo kartou na účet tábora.',
        illustration: { kind: 'payment', label: 'Ilustrace: QR platba, zaplaceno' },
      },
      {
        season: 'Duben až květen',
        title: 'Papíry bez papírů',
        text: 'Souhlasy rodiče podepíšou online, potvrzení od lékaře vyfotí mobilem.',
        illustration: { kind: 'consent', label: 'Ilustrace: souhlas podepsaný online' },
      },
      {
        season: 'Před odjezdem',
        title: 'Všechno připravené',
        text: 'Seznam na autobus, objednávka triček, kdo se nesmí fotit.',
        chips: ['Seznam na autobus', 'Objednávka triček', 'Kdo se nesmí fotit'],
      },
      {
        season: 'Na táboře',
        title: 'Hlava volná pro program',
        text: 'Zdravotní deník, oddíly a tiskové sestavy.',
        planned: true,
      },
      {
        season: 'Po táboře',
        title: 'Čistý stůl',
        text: 'Potvrzení o účasti pro zaměstnavatele a pojišťovny, citlivá data smažete jedním krokem.',
        planned: true,
      },
    ],
  },

  parents: {
    id: 'rodice',
    eyebrow: '02 / Pro rodiče',
    title: 'Rodiče to zvládnou z gauče',
    note: 'Místo je jejich ve chvíli, kdy přihlášku odešlou. Poslední místo nikdy nedostanou dvě rodiny.',
    aside:
      'Přihlašuje se někdo radši po telefonu nebo na papíře? Přihlášku za něj zapíšete v administraci a v přehledu bude stejně jako ostatní.',
    steps: [
      {
        text: 'Vyberou turnus a vyplní přihlášku. Cena se počítá přímo před nimi, včetně slevy na sourozence.',
        label: 'Ukázka: přihláška na mobilu s cenou po slevě na sourozence',
      },
      {
        text: 'Do e-mailu dostanou potvrzení, přihlášku v PDF a QR kód k platbě.',
        label: 'Ukázka: odeslaná přihláška s QR kódem k platbě zálohy',
      },
      {
        text: 'V portálu vidí, co ještě zbývá: doplatit, podepsat souhlas, nahrát potvrzení. Žádné heslo, stačí odkaz z e-mailu.',
        label: 'Ukázka: portál rodiče se seznamem toho, co ještě zbývá',
      },
    ],
  },

  money: {
    eyebrow: '03 / Peníze pod kontrolou',
    title: 'Víte, kolik přišlo a kolik ještě chybí',
    items: [
      'Platby jdou přímo na účet vašeho tábora. Campie vaše peníze nedrží.',
      'Záloha a doplatek, sleva za včasnou přihlášku, sourozenecká sleva, slevové kódy, příplatek za autobus nebo tričko.',
      'Platby kartou se zapíšou samy. Převod zapíšete dvěma kliknutími.',
      'Komu se blíží splatnost, tomu pošlete připomínku. Všem najednou.',
    ],
    screenLabel: 'Ukázka: seznam přihlášek s platbami a tlačítkem Připomenout',
  },

  consents: {
    eyebrow: '04 / Souhlasy, které obstojí',
    title: 'Souhlas není zaškrtávací políčko',
    items: [
      'Rodič odpoví na každou položku zvlášť. S focením na web ne, s ošetřením ano.',
      'Podepsáno online, PDF s podpisem máte vy i rodič. Elektronický podpis podle evropského nařízení eIDAS (č. 910/2014).',
      'Před táborem si vytisknete, které děti se nesmí fotit.',
      'Začnete z připravených vzorů a upravíte si je podle sebe.',
    ],
    screenLabel: 'Ukázka: podpis souhlasu na mobilu',
    cardLabel: 'Ukázka: podepsaný souhlas v PDF s odpověďmi rodiče',
  },

  brand: {
    eyebrow: '05 / Vypadá jako váš tábor',
    title: 'Vaše logo, vaše barvy, vaše adresa',
    items: [
      'Rodiče se přihlašují na `vastabor.campie.cz`. E-maily i přihlášky v PDF nesou jméno vašeho tábora, ne naše.',
      'Formulář si poskládáte sám: co nepotřebujete, vypnete, co vám chybí, přidáte.',
    ],
    phonesLabel: 'Ukázka: přihlašovací stránky tří táborů, každá v barvách svého tábora',
  },

  team: {
    title: 'Celý tým, každý to své',
    lead: 'Kolegy pozvete e-mailem a každému nastavíte, kam smí.',
    roles: [
      {
        role: 'Hlavní vedoucí',
        name: 'Petr',
        chips: ['Vidí všechno', 'Zve ostatní'],
        summary: 'Vidí všechno a zve ostatní',
      },
      {
        role: 'Hospodářka',
        name: 'Jana',
        chips: ['Platby', 'Exporty pro účetní'],
        summary: 'Platby a exporty pro účetní',
      },
      {
        role: 'Zdravotník',
        name: 'Ondra',
        chips: ['Zdravotní údaje'],
        note: 'Vidí je jen on. Zdravotní dotazník přibude na jaře 2027.',
        summary: 'Zdravotní údaje vidí jen on',
      },
    ],
  },

  roadmap: {
    id: 'chystame',
    eyebrow: '06 / Co chystáme',
    title: 'Do léta toho přibude ještě hodně',
    lead: 'Campie vzniká spolu s tábory, které ho používají. Tohle je plán na sezónu 2027.',
    items: [
      {
        when: 'Teď',
        title: 'Přihlášky, platby, souhlasy a dokumenty',
        text: 'Hotovo. První tábory otevírají přihlášky v únoru 2027.',
        current: true,
      },
      {
        when: 'Na jaře 2027',
        title: 'Zdravotní dotazník a potvrzení',
        text: 'Zdravotník má před odjezdem všechno pohromadě: alergie, léky i kontakt na lékaře. Rodič dostane předvyplněnou bezinfekčnost a potvrzení pro zaměstnavatele.',
      },
      {
        when: 'Před létem 2027',
        title: 'Campie jede na tábor',
        text: 'Rozdělte děti do oddílů tak, aby kamarádi zůstali spolu. Zdravotní deník i klíšťata zapíšete do mobilu. Nástupní listinu vytisknete jedním kliknutím.',
      },
      {
        when: 'Na podzim 2027',
        title: 'Po sezóně',
        text: 'Citlivá data nedržíte déle, než musíte. A všechno své si kdykoli odnesete.',
      },
    ],
    disclaimer: 'Termíny jsou plán, ne slib.',
    missing: {
      title: 'Něco vám tu chybí?',
      text: 'Napište nám, co by vám na táboře ušetřilo nejvíc práce. Plán stavíme podle toho, co vedoucí opravdu potřebují.',
      cta: { label: 'Napsat, co chybí', href: '/kontakt' } satisfies Cta,
    },
  },

  testimonials: {
    id: 'tabory',
    eyebrow: '07 / Tábory s Campie',
    title: 'Tábory, které už papírování neřeší',
    lead: 'Campie vzniklo na táboře, ne v kanceláři.',
    items: [
      {
        quote:
          'Campie nám před táborem ušetřilo desítky hodin se správou přihlášek a komunikací s rodiči. Během tábora jsem se jako hlavní vedoucí mohl naplno věnovat dětem a programu a neřešit, kdo co nezaplatil a komu chybí jaký papír.',
        name: 'David Stráňava',
        role: 'hlavní vedoucí, Tábor Domino',
      },
    ],
  },

  dataSafety: {
    title: 'Data dětí jsou v bezpečí',
    link: { label: 'Více o bezpečnosti a datech', href: '/bezpecnost' } satisfies Cta,
    points: [
      'Vidí je jen váš tým. Každému nastavíte, kam smí. Zdravotní údaje jen tomu, kdo je potřebuje.',
      'Rodná čísla a všechny nahrané dokumenty jsou šifrované. Ani my se k datům vašich dětí bez vašeho svolení nepodíváme.',
      'Zdrojový kód je veřejný. Kdokoli si může ověřit, jak s daty zacházíme.',
    ],
  },

  faq: {
    id: 'otazky',
    eyebrow: '08 / Časté otázky',
    title: 'Na co se vedoucí ptají',
    items: faq,
  },
} as const;
