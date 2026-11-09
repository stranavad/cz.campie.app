import { useState } from 'react';

import type { ConsoleOrganisation } from '@repo/schema/console';

// Lower case without diacritics, so "tabor" finds "Tábor".
const fold = (text: string) =>
  text
    .normalize('NFD')
    .replaceAll(/\p{Diacritic}/gu, '')
    .toLocaleLowerCase('cs');

export function useOrganisationTable(organisations: readonly ConsoleOrganisation[]) {
  const [search, setSearch] = useState('');
  const needle = fold(search.trim());
  // Awaiting approval first: the operator's work.
  const sorted = [...organisations].sort((a, b) => Number(b.status === 'pending') - Number(a.status === 'pending'));

  return {
    search,
    setSearch,
    rows:
      needle === ''
        ? sorted
        : sorted.filter((organisation) =>
            [organisation.displayName, organisation.legalName, organisation.ico, organisation.subdomain].some((text) =>
              fold(text).includes(needle),
            ),
          ),
  };
}
