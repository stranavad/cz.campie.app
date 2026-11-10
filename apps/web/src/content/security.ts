import { site } from './site.ts';
import type { Cta, Feature, PageHero } from './types.ts';

// "Bezpečnost a data": where the data is, who sees it and what is done with it.
export const security = {
  hero: {
    eyebrow: 'Bezpečnost a data',
    title: 'Kde data jsou, kdo je vidí a co s nimi děláme',
    lead: 'Krátce a na rovinu, abyste uměli odpovědět i rodiči, který se zeptá.',
  } satisfies PageHero,

  items: [
    {
      title: 'Tábory jsou oddělené',
      text: 'Data každé organizace jsou oddělená už na úrovni databáze. Jeden tábor nikdy neuvidí data druhého.',
    },
    {
      title: 'Šifrování',
      text: 'Každá organizace má vlastní klíč. Šifrujeme rodná čísla, klíče k platební bráně a každý nahraný nebo vytvořený soubor. Zdravotní dotazníky budou šifrované od chvíle, kdy přibudou.',
    },
    {
      title: 'My jako provozovatel',
      text: 'K datům účastníků se běžně nedostaneme. Přístup pro podporu nám musí povolit vlastník tábora, platí omezenou dobu a každý krok je vidět v historii tábora. Říkáme to na rovinu: je to pravidlo aplikace, ne kryptografická záruka.',
    },
    {
      title: 'Historie změn',
      text: 'U každé změny je vidět, kdo ji udělal a kdy. Stejně tak u každého zobrazení zdravotních údajů a každého exportu s citlivými sloupci.',
    },
    {
      title: 'Rodiče',
      text: 'Přihlašují se odkazem z e-mailu, který platí jen pro jeden tábor. K datům jiné rodiny se žádná rodina nedostane.',
    },
    {
      title: 'Účty týmu',
      text: 'Dvoufázové přihlášení kódem z aplikace je k dispozici a vlastník ho může nařídit všem.',
    },
    {
      title: 'Mazání',
      text: 'Na žádost rodiče vlastník trvale smaže přihlášku se všemi soubory. Vyčištění zdravotních údajů po turnusu přibude na podzim 2027.',
    },
    {
      title: 'Osobní údaje (GDPR)',
      text: 'Tábor je správce údajů, Campie zpracovatel. Smlouvu o zpracování přijímáte při registraci. Kde jsou data uložena a kdo je zpracovává, najdete na stránce [Zpracování dat](app:/zpracovani-dat).',
    },
    {
      title: 'Otevřený kód',
      text: 'Campie je open source pod licencí AGPL-3.0, veřejný od prvního commitu. Nejste závislí na jedné firmě a nic se neděje za zavřenými dveřmi.',
    },
  ],

  links: [
    { label: 'Zdrojový kód Campie', href: site.repoUrl },
    { label: 'Zeptat se na data', href: '/kontakt' },
  ],
} as const satisfies { hero: PageHero; items: readonly Feature[]; links: readonly Cta[] };
