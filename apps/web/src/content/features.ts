import type { Feature, PageHero } from './types.ts';

// "Co umí": what Campie does today, in three groups.
export const features = {
  hero: {
    eyebrow: 'Co umí',
    title: 'Od první přihlášky po poslední podepsaný souhlas',
    lead: 'Všechno, co Campie umí dnes. První tábory otevírají přihlášky v únoru 2027.',
  } satisfies PageHero,

  groups: [
    {
      title: 'Než otevřete přihlášky',
      lead: 'Nastavení tábora zvládnete za jedno odpoledne.',
      illustration: {
        kind: 'setup',
        label: 'Ilustrace: výběr barvy tábora a pole přihlášky, která jde zapnout a vypnout',
      },
      items: [
        {
          title: 'Vlastní adresa a vzhled',
          text: 'Přihlašování běží na `vastabor.campie.cz` s vaším logem, barvou, popisem a fotkou. Čitelné barvy textu se vyberou samy.',
        },
        {
          title: 'Tábory a turnusy',
          text: 'Každý turnus má svůj termín, místo, kapacitu, věkové hranice, začátek a konec přihlašování a vlastní ceník.',
        },
        {
          title: 'Přihláška podle vás',
          text: 'Začnete z hotové přihlášky. Rodné číslo, pojišťovnu, tričko, dopravu nebo kamaráda vypnete, necháte nepovinné, nebo povinné. **Přidáte vlastní otázky.** Změny během sezóny se nedotknou přihlášek, které už přišly.',
        },
        {
          title: 'Ceny a slevy',
          text: 'Základní cena, cena za včasnou přihlášku, záloha a doplatek, sleva na sourozence, slevové kódy, příplatky za autobus nebo tričko a slevy, které ověřujete sami, třeba pro věrné táborníky.',
        },
        {
          title: 'Vlastní prohlášení',
          text: 'Vaše podmínky, storno podmínky a informace o zpracování osobních údajů. Každé s odkazem nebo PDF, povinné nebo nepovinné.',
        },
        {
          title: 'Vlastní texty e-mailů',
          text: 'U každého e-mailu upravíte předmět i text, můžete ho vypnout a nejdřív si ho poslat na zkoušku.',
        },
        {
          title: 'Tým a oprávnění',
          text: 'Kolegy pozvete e-mailem. Každému nastavíte pro každou oblast nic, čtení, nebo zápis. Hospodář vidí platby, zdravotní údaje jen zdravotník.',
        },
      ],
    },
    {
      title: 'Pro rodiče',
      lead: 'Všechno vyřídí z mobilu, bez hesla.',
      illustration: { kind: 'parents', label: 'Ilustrace: záloha zaplacená QR kódem a podepsaný souhlas' },
      items: [
        {
          title: 'Přihláška z mobilu',
          text: 'Vyberou turnus, přidají sourozence do jedné přihlášky a cena se přepočítá s každou slevou a příplatkem.',
        },
        {
          title: 'Místo, které je opravdu jejich',
          text: 'Místo je obsazené ve chvíli, kdy přihlášku odešlou. Poslední místo nikdy nedostanou dvě rodiny.',
        },
        {
          title: 'Potvrzení v e-mailu',
          text: 'Přihláška v PDF, pokyny k platbě a QR kód do bankovní aplikace.',
        },
        {
          title: 'Kartou nebo převodem',
          text: 'Převod s QR kódem vždy. Kartou, pokud má tábor vlastní bránu Comgate. Teď záloha, zbytek později.',
        },
        {
          title: 'Portál bez hesla',
          text: 'Přihlášení odkazem z e-mailu. Oba rodiče mají stejná práva, tábor může přidat i e-mail babičky nebo dědy.',
        },
        {
          title: 'Jeden seznam úkolů na dítě',
          text: 'Platba, každý souhlas, každý požadovaný dokument. Rodič vidí přesně, co ještě zbývá.',
        },
        {
          title: 'Souhlasy online',
          text: 'Přečtou, na jednotlivé body (třeba focení) odpoví ano nebo ne, podepíšou jménem a místem a podepsané PDF dostanou e-mailem. Později můžou souhlas odvolat nebo podepsat znovu.',
        },
        {
          title: 'Dokumenty',
          text: 'Stáhnou si propozice nebo seznam věcí, nahrají fotku nebo sken toho, co tábor chce, a vidí, jestli byl dokument schválen, nebo vrácen.',
        },
      ],
    },
    {
      title: 'Během sezóny',
      lead: 'Přehled o dětech, penězích a papírech.',
      illustration: { kind: 'season', label: 'Ilustrace: přehled turnusu, obsazená místa, platby a souhlasy' },
      items: [
        {
          title: 'Přehled turnusu',
          text: 'Obsazená místa proti kapacitě. Kolik peněz čekáte, kolik přišlo a kolik chybí.',
        },
        {
          title: 'Jeden seznam dětí',
          text: 'Hledání podle dítěte, rodiče, e-mailu nebo variabilního symbolu. Filtr na ty, kdo nezaplatili, nepodepsali nebo nenahráli.',
        },
        {
          title: 'Detail přihlášky',
          text: 'Všechno o jedné rodině na jedné obrazovce: odpovědi, rozpis ceny, platby, souhlasy, dokumenty a historie změn.',
        },
        {
          title: 'Přihlášky po telefonu a na papíře',
          text: 'Přihlášku založíte ručně, rodinu přesunete na jiný turnus, dítě odhlásíte a místo se uvolní.',
        },
        {
          title: 'Platby',
          text: 'Platby kartou se zapíšou samy. Převod zapíšete ručně s datem a poznámkou. Vratky a jednorázové slevy mají čistou historii.',
        },
        {
          title: 'Připomínky jedním kliknutím',
          text: 'Jedna akce napíše všem, kdo nezaplatili nebo jsou po splatnosti. Druhá všem, komu chybí souhlas nebo dokument.',
        },
        {
          title: 'Přehled souhlasů',
          text: 'Kdo podepsal, kdo ne a kdo s čím nesouhlasil. Každé podepsané PDF si stáhnete.',
        },
        {
          title: 'Kontrola dokumentů',
          text: 'Nahraný dokument schválíte, vrátíte s poznámkou, která přijde rodiči e-mailem, nebo odškrtnete „odevzdáno na papíře“. Interní dokumenty rodiče nevidí.',
        },
        {
          title: 'Exporty do Excelu',
          text: 'Vyberete sloupce z vlastní přihlášky a uložíte si sestavy (seznam na autobus, objednávka triček) i pro kolegy. Zvlášť export plateb pro účetní.',
        },
        {
          title: 'Historie změn',
          text: 'Kdo co změnil nebo si zobrazil. Čitelná pro vlastníka.',
        },
      ],
    },
  ],
} as const satisfies {
  hero: PageHero;
  groups: readonly {
    title: string;
    lead: string;
    illustration: { kind: string; label: string };
    items: readonly Feature[];
  }[];
};
