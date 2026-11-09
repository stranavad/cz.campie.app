// The platform's legal texts, in the order the header tabs and the footer list them; a tab takes the short
// label, the footer the full one.
export const LEGAL_PAGES = [
  { to: '/platform/podminky', label: 'platformShell.legal.terms', tabLabel: 'platformShell.legal.terms' },
  {
    to: '/platform/zpracovatelska-smlouva',
    label: 'platformShell.legal.dataProcessingAgreement',
    tabLabel: 'platformShell.legal.dataProcessingAgreement',
  },
  {
    to: '/platform/zpracovani-dat',
    label: 'platformShell.legal.dataPage',
    tabLabel: 'platformShell.legal.dataPageShort',
  },
] as const;
