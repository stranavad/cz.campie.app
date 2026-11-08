import type { ConsentContent, ConsentItem } from '../consent/consent.resource.ts';

// A ready Consent an admin starts from instead of a blank page: content without item ids or a PDF,
// which the editor adds when it opens the starter as a new, unsaved Consent.
export interface StarterConsent extends Omit<ConsentContent, 'items' | 'fileId'> {
  readonly key: string;
  readonly items: readonly Omit<ConsentItem, 'id'>[];
}

// Derived from Tábor Domino's GDPR and operational consents, published under the repository's licence
// with the permission recorded in docs/issues/52-starter-consents.md. The texts name no camp, place or
// organiser and never insert the camp's data, so nothing needs declining; the Organisation's legal
// identity comes with the signed PDF.
export const STARTER_CONSENTS = [
  {
    key: 'gdpr',
    title: 'Souhlas se zpracováním osobních údajů',
    introduction:
      'Souhlas podle čl. 6 odst. 1 písm. a) a čl. 7 nařízení Evropského parlamentu a Rady (EU) 2016/679 (GDPR). ' +
      'Souhlas je dobrovolný, každou položku můžete udělit samostatně a kdykoli ji odvolat. Údaje nezbytné ' +
      'pro organizaci pobytu zpracováváme bez souhlasu na základě smlouvy a zákonných povinností - podrobnosti ' +
      'najdete v informacích pořadatele o zpracování osobních údajů.\n\n' +
      'Fotografie a videa pořízené během tábora můžeme využít ve třech oddělených režimech. Ke každému z nich, ' +
      'stejně jako k uvedení jména dítěte, se souhlas uděluje samostatně.',
    withdrawable: true,
    items: [
      {
        kind: 'yes_no',
        text:
          'Sdílení fotografií a videí v uzavřené skupině pro rodiče\n' +
          'Účel: průběžná dokumentace pobytu pro rodiče účastníků tábora.\n' +
          'Kde: uzavřená online skupina nebo úložiště přístupné pouze schváleným členům - rodičům účastníků ' +
          'daného ročníku.\n' +
          'Doba uchování: 1 rok od skončení tábora; poté archiv v interním uzavřeném úložišti mimo skupinu pro ' +
          'rodiče.',
      },
      {
        kind: 'yes_no',
        text:
          'Použití fotografií a videí k propagaci pořadatele\n' +
          'Účel: propagace činnosti pořadatele a získávání nových účastníků.\n' +
          'Kde: webové stránky pořadatele a jeho veřejné profily na sociálních sítích.\n' +
          'Doba uchování: 3 roky od pořízení; poté budou fotografie a videa z veřejných kanálů odstraněny.',
      },
      {
        kind: 'yes_no',
        text:
          'Předání fotografií a videí tisku a partnerům\n' +
          'Účel: spolupráce s tiskem, místními médii nebo partnerskými organizacemi (články, reportáže, ' +
          'propagační materiály).\n' +
          'Kde: tisk, online zpravodajství, propagační materiály partnerů, vždy ve spojení s činností pořadatele.\n' +
          'Doba uchování: po dobu konkrétní spolupráce, po jejím skončení nejvýše 3 roky.',
      },
      {
        kind: 'yes_no',
        text:
          'Uvedení jména a příjmení dítěte na diplomech a ve výsledcích her a soutěží\n' +
          'Účel: předání ocenění dítěti a zveřejnění výsledků táborových soutěží.\n' +
          'Kde: diplomy předané dítěti; výsledky v uzavřené skupině pro rodiče.\n' +
          'Doba uchování: vyvěšené výsledky do skončení tábora; diplom si dítě odnáší.',
      },
      {
        kind: 'information',
        text:
          'Vaše práva\n' +
          'Souhlas můžete kdykoli odvolat v portálu pro rodiče, e-mailem pořadateli nebo písemně na adresu jeho ' +
          'sídla. Odvolání souhlasu nemá vliv na zákonnost zpracování provedeného před odvoláním.\n' +
          'Máte právo na přístup ke svým údajům, jejich opravu, výmaz, omezení zpracování a přenositelnost a ' +
          'právo podat stížnost u Úřadu pro ochranu osobních údajů (uoou.gov.cz).',
      },
    ],
  },
  {
    key: 'operational',
    title: 'Provozní souhlasy',
    introduction:
      'Souhlasy s aktivitami dítěte a se zdravotní péčí během tábora. Každý z nich můžete udělit nebo ' +
      'neudělit nezávisle - neudělení jednoho souhlasu nemá vliv na možnost účasti dítěte na táboře, pouze na ' +
      'rozsah konkrétní aktivity. Závěrečná prohlášení jsou podmínkou účasti.',
    withdrawable: false,
    items: [
      {
        kind: 'yes_no',
        text:
          'Účast na noční hře\n' +
          'Noční táborová hra v areálu tábora a v jeho blízkém okolí, organizovaná pod dohledem vedoucích.',
      },
      {
        kind: 'yes_no',
        text:
          'Samostatný pohyb dítěte během výletů\n' +
          'Pohyb v menších skupinách bez přímého dozoru vedoucího v rámci stanovených pravidel a vymezeného ' +
          'prostoru. Děti mladší 12 let pouze v doprovodu zletilé osoby.',
      },
      {
        kind: 'yes_no',
        text:
          'Poskytnutí předlékařské první pomoci a podání volně prodejných léků\n' +
          'Při běžných obtížích (bolest, zvýšená teplota, bolest v krku, kašel, žaludeční nevolnost, anafylaktická ' +
          'reakce) může zdravotník tábora podat dítěti běžné volně prodejné léky a poskytnout předlékařskou první ' +
          'pomoc.',
      },
      {
        kind: 'yes_no',
        text:
          'Doprovod a převoz dítěte k lékaři\n' +
          'Pokud bude potřeba ošetření mimo areál tábora, může dítě doprovodit a osobním autem převézt do ordinace ' +
          'dětského lékaře nebo do nemocnice zdravotník, vedoucí tábora nebo jiná osoba pověřená pořadatelem.',
      },
      {
        kind: 'yes_no',
        text:
          'Získání informací o zdravotním stavu dítěte od ošetřujícího lékaře\n' +
          'Osoba pověřená pořadatelem (zdravotník, vedoucí) může od ošetřujícího lékaře převzít informace ' +
          'o aktuálním zdravotním stavu dítěte a o navržené léčbě.',
      },
      {
        kind: 'yes_no',
        text:
          'Rutinní ambulantní ošetření v rozsahu nezbytné péče (drobná poranění, šití, fixace končetin, podání ' +
          'léku doporučeného lékařem)\n' +
          'Osoba pověřená pořadatelem může za zákonného zástupce udělit souhlas s rutinním ambulantním ' +
          'ošetřením, které nevyžaduje hospitalizaci. Akutní a život zachraňující péče probíhá podle § 38 zákona ' +
          'č. 372/2011 Sb. bez ohledu na souhlas. Při hospitalizaci a invazivních výkonech bude vždy kontaktován ' +
          'zákonný zástupce.',
      },
      {
        kind: 'yes_no',
        text:
          'Orientační testování na omamné a psychotropní látky (jen při důvodném podezření)\n' +
          'Při důvodném podezření z užití omamných nebo psychotropních látek může být provedeno orientační ' +
          'testování (slinný nebo močový test). Test provede zdravotník v soukromí, výsledek se předává výhradně ' +
          'zákonnému zástupci a při pozitivním výsledku je dítě v doprovodu zákonného zástupce z tábora odesláno ' +
          'domů.',
      },
      {
        kind: 'must_agree',
        text:
          'Prohlašuji, že zdravotní údaje o dítěti, které jsem pořadateli předal/a, odpovídají skutečnosti ke dni ' +
          'nástupu dítěte na tábor a jsou úplné. Jsem si vědom/a, že zatajení důležitých okolností o zdravotním ' +
          'stavu dítěte může ohrozit zdraví dítěte i ostatních účastníků a může vést k vyloučení z tábora.',
      },
      {
        kind: 'must_agree',
        text:
          'Beru na vědomí, že odpovědnost za škodu způsobenou dítětem se řídí § 2920 a násl. zákona č. 89/2012 ' +
          'Sb., občanský zákoník. Při úmyslném poškození vybavení tábora nebo prokazatelně hrubém zanedbání ze ' +
          'strany dítěte se zavazuji uhradit prokázanou škodu.',
      },
    ],
  },
] as const satisfies readonly StarterConsent[];
