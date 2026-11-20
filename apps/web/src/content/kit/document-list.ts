import type { DocumentSlug } from './types.ts';

// The document templates of /vzory, as the hub and the guides link them. `kind` says what the page
// offers: a form whose wording a regulation prescribes, or a template the organiser adapts.
export interface DocumentRef {
  slug: DocumentSlug;
  // Short name for lists and the breadcrumb.
  nav: string;
  // One line for a card.
  summary: string;
  kind: 'form' | 'generator';
}

export const documentList: readonly DocumentRef[] = [
  {
    slug: 'prohlaseni-o-bezinfekcnosti',
    nav: 'Prohlášení o bezinfekčnosti',
    summary: 'Písemné prohlášení rodičů podle § 9 zákona, s hlavičkou vašeho tábora.',
    kind: 'generator',
  },
  {
    slug: 'posudek-o-zdravotni-zpusobilosti-ditete',
    nav: 'Posudek o zdravotní způsobilosti dítěte',
    summary: 'Formulář s obsahem podle vyhlášky ve znění od 1. 1. 2026, na jednu stranu A4.',
    kind: 'form',
  },
  {
    slug: 'souhlas-se-zpracovanim-osobnich-udaju',
    nav: 'Souhlas s fotografiemi a zpracováním údajů',
    summary: 'Oddělené souhlasy pro galerii, web a sociální sítě. Jen to, co souhlas opravdu potřebuje.',
    kind: 'generator',
  },
  {
    slug: 'souhlasy-rodicu-na-tabor',
    nav: 'Souhlasy rodičů k pobytu',
    summary: 'Léky, doprovod k lékaři, společné ubytování, samostatný pohyb. Vyberete, co se vás týká.',
    kind: 'generator',
  },
];

export const documentBySlug = Object.fromEntries(documentList.map((item) => [item.slug, item])) as Record<
  DocumentSlug,
  DocumentRef
>;
