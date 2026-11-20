import { at, par } from '../cite.ts';
import type { DocumentTemplate } from './types.ts';

export const bezinfekcnost = {
  slug: 'prohlaseni-o-bezinfekcnosti',
  seoTitle: 'Prohlášení o bezinfekčnosti na tábor - vzor 2027 (PDF)',
  description:
    'Vzor prohlášení o bezinfekčnosti dítěte podle § 9 zákona č. 258/2000 Sb. Ke stažení v PDF, nebo s logem a údaji vašeho tábora. Co v něm musí být a jak staré smí být.',
  pageTitle: 'Prohlášení o bezinfekčnosti',
  lead: 'Písemné prohlášení rodičů, bez kterého dítě na zotavovací akci přijmout nesmíte. Stáhněte prázdný vzor, nebo si ho upravte na svůj tábor.',
  title: 'Prohlášení o bezinfekčnosti',
  subtitle: 'Písemné prohlášení podle § 9 odst. 3 zákona č. 258/2000 Sb., o ochraně veřejného zdraví',
  kind: 'template',
  before: [
    { type: 'event', blankWhenEmpty: false },
    {
      type: 'fields',
      fields: [
        { label: 'Jméno a příjmení dítěte', width: 'full' },
        { label: 'Datum narození', width: 'half' },
      ],
    },
    {
      type: 'paragraph',
      text: 'Prohlašuji, že dítě **nejeví známky akutního onemocnění** (například horečky nebo průjmu) a že **ve 14 kalendářních dnech před odjezdem** nepřišlo do styku s fyzickou osobou nemocnou infekčním onemocněním nebo podezřelou z nákazy a není mu nařízeno karanténní opatření.',
    },
  ],
  items: [
    {
      id: 'zmena-zdravotniho-stavu',
      title: 'Zdravotní stav se od posudku nezměnil',
      text: 'Prohlašuji, že od vydání posudku o zdravotní způsobilosti nedošlo ke změně zdravotního stavu dítěte, která by jeho způsobilost k účasti omezovala.',
      kind: 'statement',
      defaultOn: true,
      why: {
        text: 'Posudek platí dva roky jen tehdy, pokud se zdravotní způsobilost dítěte mezitím nezměnila. Lékař ho mohl vystavit předloni; jediný, kdo o změně ví, je rodič.',
        basis: 'advice',
        cites: [par('z258', '9', '3')],
      },
    },
    {
      id: 'kontakt',
      title: 'Telefon na rodiče po dobu tábora',
      text: 'Po dobu tábora budu k zastižení na těchto telefonních číslech:',
      kind: 'statement',
      fields: [
        { label: 'Telefon', width: 'half' },
        { label: 'Druhý telefon', width: 'half' },
      ],
      defaultOn: true,
      why: {
        text: 'O zdravotních potížích dítěte musíte informovat osobu, která ho má v péči. Číslo platné v den odjezdu je spolehlivější než to z jarní přihlášky.',
        basis: 'advice',
        cites: [par('z258', '11', '1', 'f')],
      },
    },
    {
      id: 'vsi',
      title: 'Kontrola vlasů',
      text: 'Prohlašuji, že jsem dítěti před odjezdem zkontroloval(a) vlasy a nenašel(a) jsem vši ani hnidy.',
      kind: 'statement',
      defaultOn: false,
      why: {
        text: 'Zákon to nežádá. Kontrola při nástupu ale patří ke zdravotnímu filtru, se kterým počítá osnova kurzu zdravotníka, a prohlášení rodiče ji usnadní.',
        basis: 'advice',
        cites: [at('v106', 'příloha č. 2, bod 6.4')],
      },
    },
    {
      id: 'zmocneni',
      title: 'Podepisuje zmocněná osoba',
      text: 'Prohlášení podepisuji jako osoba, kterou k tomu zákonný zástupce dítěte písemně zmocnil. Zmocnění přikládám.',
      kind: 'statement',
      fields: [{ label: 'Jméno a příjmení zmocněné osoby', width: 'full' }],
      defaultOn: false,
      why: {
        text: 'Místo rodiče může prohlášení podepsat a dítě předat jiná osoba, třeba prarodič, jen s písemným zmocněním od zákonného zástupce.',
        basis: 'law',
        cites: [par('z258', '9', '3')],
      },
    },
  ],
  after: [
    {
      type: 'paragraph',
      text: 'Jsem si vědom(a) právních následků, které by mě postihly, kdyby toto prohlášení nebylo pravdivé.',
    },
    { type: 'signature', signers: ['Podpis zákonného zástupce'] },
    {
      type: 'note',
      text: 'Prohlášení nesmí být starší než jeden den. Podepište ho v den odjezdu nebo den předem a odevzdejte při nástupu dítěte.',
    },
  ],
  explain: {
    title: 'Co k prohlášení říká zákon',
    sections: [{ guide: 'podminky-ucasti-deti', section: 'bezinfekcnost' }],
    answer: { section: { guide: 'podminky-ucasti-deti', id: 'bezinfekcnost' }, index: 1 },
    facts: [
      {
        text: 'Povinné jádro vzoru je odstavec o známkách onemocnění a o kontaktu s infekcí. Jeho slova přebíráme ze zákona a v konfigurátoru ho nejde vypnout.',
        basis: 'law',
        cites: [par('z258', '9', '1', 'b'), par('z258', '9', '1', 'c')],
      },
      {
        text: 'Ve starších vzorech bývá věta o tom, že lékař nenařídil dítěti "změnu režimu", nebo zmínka o covidu. Zákon nic z toho nežádá.',
        basis: 'law',
        cites: [par('z258', '9', '1')],
      },
      {
        text: 'Rodné číslo dítěte ve vzoru není. K ověření totožnosti stačí jméno a datum narození a rodné číslo smíte využívat jen se souhlasem.',
        basis: 'law',
        cites: [par('z133', '13c', '1')],
      },
    ],
  },
  inCampie:
    'V Campie má každé dítě seznam toho, co ještě chybí. Posudek rodiče nahrají předem, bezinfekčnost odevzdají při odjezdu a vy v seznamu vidíte, kdo ji už má.',
  related: {
    guides: ['podminky-ucasti-deti', 'zotavovaci-akce-nebo-jina-podobna-akce'],
    documents: ['posudek-o-zdravotni-zpusobilosti-ditete', 'souhlasy-rodicu-na-tabor'],
  },
  verified: '2026-11-19',
} as const satisfies DocumentTemplate;
