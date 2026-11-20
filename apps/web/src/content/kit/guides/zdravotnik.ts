import { at, par } from '../cite.ts';
import type { Guide } from '../types.ts';

export const zdravotnik = {
  slug: 'zdravotnik-a-lekarnicka',
  nav: 'Zdravotník a lékárnička',
  title: 'Zdravotník, lékárnička a zdravotnický deník',
  seoTitle: 'Zdravotník a lékárnička na dětském táboře (2027)',
  description:
    'Kdo může dělat zdravotníka na táboře, co obnáší kurz zdravotníka zotavovacích akcí, co musí být v lékárničce podle vyhlášky od roku 2026 a jak vést zdravotnický deník.',
  lead: 'Zdravotník je jediná role, které zákon předepisuje kvalifikaci. A jediná, která musí být po ruce ve dne v noci.',
  summary: 'Kvalifikace, povinnosti, obsah lékárničky a dokumentace.',
  sections: [
    {
      id: 'kdo',
      title: 'Kdo může být zdravotníkem',
      facts: [
        {
          text: 'Zdravotníkem může být lékař, zubní lékař, všeobecná sestra, porodní asistentka, zdravotnický záchranář nebo zdravotnický asistent.',
          basis: 'law',
          cites: [par('z258', '11', '1', 'a')],
        },
        {
          text: 'Dále **absolvent kurzu první pomoci se zaměřením na zdravotnickou činnost při zotavovací akci** a student všeobecného nebo zubního lékařství po úspěšně ukončeném třetím ročníku.',
          basis: 'law',
          cites: [par('z258', '11', '1', 'a')],
          quote:
            'fyzická osoba, která absolvovala kurs první pomoci se zaměřením na zdravotnickou činnost při škole v přírodě nebo zotavovací akci, a student studijního programu v oblasti vzdělávání Všeobecné lékařství a zubní lékařství po úspěšném ukončení třetího ročníku',
        },
        {
          text: 'Kurz má **40 hodin**, z toho 21 hodin teorie a 19 hodin praxe. Od roku 2026 jeho osnova nově obsahuje mimo jiné resuscitaci dětí, použití AED a anafylaxi.',
          basis: 'law',
          cites: [at('v106', 'příloha č. 2'), at('v400')],
          since: '2026-01-01',
          change:
            'Osnova kurzu zdravotníka nově obsahuje resuscitaci dětí, použití AED a anafylaxi. Dřívější kurzy platí dál.',
        },
        {
          text: 'Kdo má kurz podle dřívější osnovy, zůstává způsobilý. Zákon ani vyhláška platnost osvědčení časově neomezují.',
          basis: 'law',
          cites: [at('v400', 'čl. II'), par('z258', '11', '1', 'a')],
        },
        {
          text: 'Zdravotník musí být sám zdravotně způsobilý. Pokud není zdravotnickým pracovníkem, předá pořadateli posudek jako ostatní.',
          basis: 'law',
          cites: [par('z258', '10', '1'), par('z258', '10', '2')],
        },
      ],
    },
    {
      id: 'povinnosti',
      title: 'Co zdravotník dělá',
      facts: [
        {
          text: 'Zajišťuje základní péči o zdraví všech účastníků, kontroluje dodržování hygienických požadavků a osobní hygienu lidí u stravování.',
          basis: 'law',
          cites: [par('z258', '11', '1', 'a')],
        },
        {
          text: 'Musí být **dosažitelný 24 hodin denně** po celou dobu tábora a bydlet v bezprostřední blízkosti ošetřovny.',
          basis: 'law',
          cites: [par('z258', '11', '1', 'b'), par('v106', '4', '1')],
        },
        {
          text: 'Je u převzetí posudků a prohlášení o bezinfekčnosti a podílí se na sestavení jídelníčku a režimu dne.',
          basis: 'law',
          cites: [par('z258', '11', '1', 'b'), par('v106', '7', '5')],
        },
        {
          text: 'Posuzuje zdravotní stav dětí, které pomáhají s přípravou a výdejem jídla.',
          basis: 'law',
          cites: [par('v106', '7', '7')],
          since: '2026-01-01',
        },
        {
          text: 'Při výskytu infekčního onemocnění manipuluje s ložním prádlem jen zdravotník. Při epidemickém výskytu to smí i jím poučená osoba starší 18 let.',
          basis: 'law',
          cites: [par('v106', '4', '3')],
          since: '2026-01-01',
          change:
            'S ložním prádlem při epidemickém výskytu infekce smí vedle zdravotníka manipulovat i jím poučená osoba starší 18 let.',
        },
      ],
    },
    {
      id: 'dokumentace',
      title: 'Deník a další dokumentace',
      facts: [
        {
          text: 'Vede se **zdravotnický deník** a seznam účastníků. Spolu s prohlášeními a výpisy z posudků se uchovávají 6 měsíců po skončení tábora.',
          basis: 'law',
          cites: [par('z258', '11', '1', 'e')],
        },
        {
          text: 'Co přesně do deníku psát, zákon ani vyhláška neurčují. Osnova kurzu zdravotníka počítá s evidencí bezinfekčnosti, lékařských potvrzení a s vedením deníku.',
          basis: 'law',
          cites: [par('z258', '11', '1', 'e'), at('v106', 'příloha č. 2')],
        },
        {
          text: 'U každého ošetření zapište datum a čas, jméno dítěte, potíže, co jste udělali a podali, a kdo zápis provedl. Z takového deníku pak snadno splníte povinnost informovat rodiče.',
          basis: 'advice',
          cites: [par('z258', '11', '1', 'e'), par('z258', '11', '1', 'f')],
        },
        {
          text: 'Léky a zdravotnická dokumentace musí být zajištěny tak, aby se k nim nedostaly děti ani nepovolané osoby.',
          basis: 'law',
          cites: [par('v106', '3', '6')],
        },
      ],
    },
    {
      id: 'lekarnicka',
      title: 'Lékárnička podle vyhlášky',
      intro: 'Minimální obsah určuje příloha č. 4 vyhlášky, naposledy změněná od 1. 1. 2026.',
      facts: [
        {
          text: '**Léčivé přípravky** (jen volně prodejné): proti teplotě a bolesti, proti nevolnosti při jízdě, při průjmu, proti kašli, kloktadlo, oční kapky nebo mast s dezinfekčním účinkem a oční voda, mast nebo gel na štípnutí hmyzem, tablety při alergické reakci, dezinfekce kůže, inertní mast nebo vazelína.',
          basis: 'law',
          cites: [at('v106', 'příloha č. 4, část I')],
        },
        {
          text: '**Obvazový a zdravotnický materiál**: sterilní gázové kompresy, náplast na cívce, rychloobvaz, elastické obinadlo, sterilní obvaz, škrtící pryžové obinadlo, trojcípý šátek, vata obvazová a buničitá, lékařský teploměr, bariérová ochrana pro umělé dýchání, pinzeta anatomická a chirurgická, pryžové rukavice, rouška PVC a **izotermická fólie**.',
          basis: 'law',
          cites: [at('v106', 'příloha č. 4, část II')],
          since: '2026-01-01',
          change: 'Do povinného obsahu lékárničky přibyla izotermická fólie.',
        },
        {
          text: '**Různé**: nůžky, zavírací špendlíky, záznamník s tužkou a svítilna včetně zdroje.',
          basis: 'law',
          cites: [at('v106', 'příloha č. 4, část III')],
        },
        {
          text: 'Lékárničku vybavíte podle druhu akce. Příloha je minimum; putovní tábor nebo tábor u vody si žádá víc.',
          basis: 'law',
          cites: [par('z258', '11', '1', 'd')],
        },
      ],
    },
    {
      id: 'osetrovna',
      title: 'Ošetřovna a izolace',
      facts: [
        {
          text: 'Ve stavbách se zřizuje ošetřovna v samostatné místnosti s umyvadlem s tekoucí pitnou vodou. Na stanovém táboře může být ve vyčleněném stanu.',
          basis: 'law',
          cites: [par('v106', '3', '6')],
        },
        {
          text: 'Izolaci už nemusíte zřizovat předem. Musíte ale mít podmínky, abyste ji v případě potřeby zřídili. Zřízená izolace má vlastní záchod s mytím rukou a lůžka.',
          basis: 'law',
          cites: [par('v106', '3', '6'), at('khsMsk2026')],
          since: '2026-01-01',
          change: 'Izolaci není nutné zřizovat předem. Stačí mít podmínky, aby šla v případě potřeby zřídit.',
        },
        {
          text: 'Ošetřovna ani izolace nesmějí mít patrová lůžka a nesmějí sloužit jinému účelu.',
          basis: 'law',
          cites: [par('v106', '3', '6')],
        },
      ],
    },
  ],
  related: {
    guides: ['podminky-ucasti-deti', 'ubytovani-a-hygiena', 'stravovani'],
    documents: ['posudek-o-zdravotni-zpusobilosti-ditete', 'prohlaseni-o-bezinfekcnosti', 'souhlasy-rodicu-na-tabor'],
  },
  verified: '2026-11-19',
} as const satisfies Guide;
