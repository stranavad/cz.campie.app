// The texts signup links to, on the main host (features/legal), opened in a new tab so the form keeps
// its answers. Public addresses: changing one breaks links from outside.
export const SIGNUP_LINKS = {
  terms: '/podminky',
  dataProcessingAgreement: '/zpracovatelska-smlouva',
  dataPage: '/zpracovani-dat',
} as const;
