import { at, par } from '../cite.ts';
import type { Guide } from '../types.ts';

export const osobniUdaje = {
  slug: 'osobni-udaje-a-fotografie',
  nav: 'Osobní údaje a fotografie',
  title: 'Osobní údaje, souhlasy a fotografie z tábora',
  seoTitle: 'GDPR na dětském táboře: souhlasy, fotky, rodná čísla (2027)',
  description:
    'Na přihlášku souhlas se zpracováním osobních údajů nepotřebujete, na fotky na sociálních sítích ano. Právní základy, zdravotní údaje, rodné číslo a lhůty uchování pro pořadatele táborů.',
  lead: 'Nejčastější chyba není chybějící souhlas. Je to souhlas tam, kde nemá co dělat.',
  summary: 'Kdy souhlas ano a kdy ne, fotky, rodná čísla a lhůty.',
  sections: [
    {
      id: 'pravni-zaklady',
      title: 'Na co souhlas nepotřebujete',
      facts: [
        {
          text: 'Údaje z přihlášky (dítě, rodiče, kontakty, platby) zpracováváte, protože bez nich tábor neuspořádáte. Právním základem je **plnění smlouvy**, ne souhlas.',
          basis: 'law',
          cites: [at('gdpr', 'čl. 6 odst. 1 písm. b)')],
          smallToo: true,
        },
        {
          text: 'Úřad pro ochranu osobních údajů k tomu říká, že služby poskytované na smluvním základě souhlas nevyžadují a vyžadovat ho ani nelze.',
          basis: 'authority',
          cites: [at('uoouSpolky')],
          quote: 'Souhlas se zpracováním údajů proto nelze vyžadovat.',
          smallToo: true,
        },
        {
          text: 'Posudek, prohlášení o bezinfekčnosti, seznam účastníků a zdravotnický deník zpracováváte, protože vám to **ukládá zákon**. Ani tady souhlas nepatří.',
          basis: 'law',
          cites: [at('gdpr', 'čl. 6 odst. 1 písm. c)'), par('z258', '11', '1', 'e')],
        },
        {
          text: 'Vyžadovat souhlas tam, kde máte jiný právní důvod, je podle úřadu porušením zásady transparentnosti. Rodič by nabyl dojmu, že může odvolat něco, co odvolat nejde.',
          basis: 'authority',
          cites: [at('uoouSouhlas')],
          smallToo: true,
        },
        {
          text: 'Přihlášku nesmíte podmínit souhlasem se zpracováním údajů ani se zveřejňováním fotografií.',
          basis: 'authority',
          cites: [at('uoouSouhlas')],
          quote:
            'Podmiňování přijetí přihlášky do spolku souhlasem se zpracováním osobních údajů nebo souhlasem se zveřejňováním fotografií je proto nesprávné.',
          smallToo: true,
        },
      ],
    },
    {
      id: 'informace',
      title: 'Co rodičům říct vždycky',
      facts: [
        {
          text: 'Při získání údajů musíte rodiče informovat: kdo jste a jak vás kontaktovat, k čemu údaje potřebujete a na jakém právním základě, komu je předáváte, jak dlouho je uchováte, jaká mají práva a že si mohou stěžovat u Úřadu pro ochranu osobních údajů.',
          basis: 'law',
          cites: [at('gdpr', 'čl. 13')],
          smallToo: true,
        },
        {
          text: 'Je to informace, ne souhlas. Rodič ji nepodepisuje, stačí, že ji má u přihlášky k dispozici.',
          basis: 'law',
          cites: [at('gdpr', 'čl. 13'), at('gdpr', 'čl. 12 odst. 1')],
          smallToo: true,
        },
        {
          text: 'Pokud přihlášky sbíráte přes online systém, je jeho provozovatel vaším zpracovatelem a potřebujete s ním smlouvu o zpracování osobních údajů.',
          basis: 'law',
          cites: [at('gdpr', 'čl. 28 odst. 3')],
          smallToo: true,
        },
      ],
    },
    {
      id: 'zdravotni-udaje',
      title: 'Zdravotní údaje',
      facts: [
        {
          text: 'Údaje o zdravotním stavu jsou zvláštní kategorií osobních údajů. Zpracovat je smíte jen s některou z výjimek, které nařízení vyjmenovává.',
          basis: 'law',
          cites: [at('gdpr', 'čl. 9')],
          smallToo: true,
        },
        {
          text: 'Zákonnou cestou, jak se dozvědět o alergiích a dlouhodobě užívaných lécích dítěte, je posudek o zdravotní způsobilosti. Od roku 2026 má na oba údaje vlastní řádek.',
          basis: 'law',
          cites: [at('v106', 'příloha č. 3'), par('z258', '9', '3')],
        },
        {
          text: 'Ve vlastním zdravotním dotazníku se ptejte jen na to, co pro bezpečný pobyt opravdu potřebujete, a zpřístupněte ho jen zdravotníkovi. Právní základ rozšířeného dotazníku si nechte posoudit; mezi organizacemi nepanuje shoda, zda je k němu třeba výslovný souhlas.',
          basis: 'advice',
          cites: [at('gdpr', 'čl. 5 odst. 1 písm. c) a čl. 9 odst. 2'), at('pionyrGdpr')],
          smallToo: true,
        },
        {
          text: 'Zdravotnická dokumentace musí být zajištěna tak, aby se k ní nedostaly děti ani nepovolané osoby.',
          basis: 'law',
          cites: [par('v106', '3', '6')],
        },
      ],
    },
    {
      id: 'rodne-cislo',
      title: 'Rodné číslo',
      facts: [
        {
          text: 'Rodné číslo smíte využívat jen tehdy, když to stanoví zvláštní zákon, nebo **se souhlasem** jeho nositele či zákonného zástupce.',
          basis: 'law',
          cites: [par('z133', '13c', '1')],
          smallToo: true,
        },
        {
          text: 'Žádný zákon pořadateli tábora rodné číslo dítěte neukládá. Ohlášení hygieně ho nežádá a vzor posudku pracuje s datem narození.',
          basis: 'law',
          cites: [par('z258', '8', '3'), at('v106', 'příloha č. 3')],
        },
        {
          text: 'Úřad doporučuje identifikovat lidi jménem, adresou a datem narození.',
          basis: 'authority',
          cites: [at('uoouRc')],
          smallToo: true,
        },
        {
          text: 'Rodné číslo proto v přihlášce nevyžadujte. Pokud ho rodič potřebuje na potvrzení pro zdravotní pojišťovnu, nechte pole nepovinné a vysvětlete, k čemu slouží.',
          basis: 'advice',
          cites: [par('z133', '13c', '1', 'd'), at('gdpr', 'čl. 5 odst. 1 písm. c)')],
          smallToo: true,
        },
      ],
    },
    {
      id: 'fotografie',
      title: 'Fotografie a videa',
      facts: [
        {
          text: 'Zachytit podobu člověka a šířit ji lze jen s jeho svolením. Za dítě ho dává zákonný zástupce a lze ho odvolat.',
          basis: 'law',
          cites: [par('oz', '84'), par('oz', '85'), par('oz', '87')],
          smallToo: true,
        },
        {
          text: 'Reportážní fotografie ze společných akcí zveřejňovat lze, říká úřad spolkům. Jde podle něj hlavně o slušnost a o pravidla občanského zákoníku pro podobiznu.',
          basis: 'authority',
          cites: [at('uoouSpolky')],
          smallToo: true,
        },
        {
          text: 'U dětí je úřad přísnější. Situační fotky zaměřené na průběh akce mohou stát na oprávněném zájmu, ale u **sociálních sítí** kvůli riziku dalšího šíření zpravidla ne. Tam počítejte se souhlasem.',
          basis: 'authority',
          cites: [at('uoouSkolstvi')],
          quote:
            'Souhlas musí být svobodný, konkrétní, informovaný, jednoznačný a odvolatelný bez nepříznivých následků.',
          smallToo: true,
        },
        {
          text: 'Česká rada dětí a mládeže doporučuje získat pro fotografie dětí výslovný souhlas vždy.',
          basis: 'practice',
          cites: [at('crdmFoto')],
          smallToo: true,
        },
        {
          text: 'Souhlas rozdělte podle toho, kde fotky skončí: uzavřená galerie pro rodiče, web a sociální sítě, tisk a partneři. Rodič, který nechce dítě na Instagramu, pak nemusí odmítnout i galerii.',
          basis: 'advice',
          cites: [at('gdpr', 'čl. 7 a recitál 43'), at('uoouSkolstvi')],
          smallToo: true,
        },
      ],
    },
    {
      id: 'platny-souhlas',
      title: 'Jak vypadá platný souhlas',
      facts: [
        {
          text: 'Souhlas musí být svobodný, konkrétní, informovaný a jednoznačný. Musíte být schopni doložit, že byl udělen.',
          basis: 'law',
          cites: [at('gdpr', 'čl. 4 bod 11 a čl. 7 odst. 1')],
          smallToo: true,
        },
        {
          text: 'V dokumentu, který řeší i jiné věci, musí být souhlas jasně odlišen od zbytku.',
          basis: 'law',
          cites: [at('gdpr', 'čl. 7 odst. 2')],
          smallToo: true,
        },
        {
          text: 'Odvolat souhlas musí být stejně snadné jako ho dát a rodič o tom musí vědět předem.',
          basis: 'law',
          cites: [at('gdpr', 'čl. 7 odst. 3')],
          smallToo: true,
        },
        {
          text: 'Pionýr má na přihlášce pro každý účel zvlášť volbu ano nebo ne a účast na táboře souhlasem nikdy nepodmiňuje.',
          basis: 'practice',
          cites: [at('pionyrGdpr')],
          smallToo: true,
        },
      ],
    },
    {
      id: 'lhuty',
      title: 'Jak dlouho údaje držet',
      facts: [
        {
          text: 'Údaje smíte uchovávat jen po dobu nezbytnou pro účel, ke kterému jste je získali.',
          basis: 'law',
          cites: [at('gdpr', 'čl. 5 odst. 1 písm. e)')],
          smallToo: true,
        },
        {
          text: 'Zdravotnický deník, seznam účastníků, prohlášení a výpisy z posudků: **6 měsíců** po skončení tábora.',
          basis: 'law',
          cites: [par('z258', '11', '1', 'e')],
        },
        {
          text: 'Účetní doklady 5 let, účetní závěrka 10 let.',
          basis: 'law',
          cites: [par('z563', '31', '2')],
          smallToo: true,
        },
        {
          text: 'Obecná promlčecí lhůta je 3 roky. Tak dlouho dává smysl držet přihlášku a smluvní dokumenty pro případ sporu.',
          basis: 'advice',
          cites: [par('oz', '629', '1')],
          smallToo: true,
        },
      ],
    },
  ],
  related: {
    guides: ['podminky-ucasti-deti', 'vypis-z-rejstriku-trestu-pro-praci-s-detmi', 'povinnosti-poradatele'],
    documents: ['souhlas-se-zpracovanim-osobnich-udaju', 'souhlasy-rodicu-na-tabor'],
  },
  verified: '2026-11-19',
} as const satisfies Guide;
