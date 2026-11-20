import { createRequire } from 'node:module';
import pdfmake from 'pdfmake';

import type { DocumentTemplate } from '../../content/kit/documents/types.ts';
import type { DocumentSlug } from '../../content/kit/types.ts';
import { blankDocument, type PrintDocument } from './document.ts';
import { fitPdf, FONT } from './pdf.ts';
import type { SheetLayout } from './sheet.ts';

// The build's PDF writer: the blank documents at /vzory/<slug>.pdf, and where their blocks land, which
// the page's static preview follows. Fonts are read from the package's files; nothing is fetched.
const require = createRequire(import.meta.url);

const fonts = {
  normal: require.resolve('@expo-google-fonts/figtree/400Regular/Figtree_400Regular.ttf'),
  bold: require.resolve('@expo-google-fonts/figtree/700Bold/Figtree_700Bold.ttf'),
};

export async function pdfLayout(doc: PrintDocument): Promise<{ output: Buffer; layout: SheetLayout }> {
  pdfmake.setFonts({ [FONT]: fonts });
  pdfmake.setUrlAccessPolicy(() => false);
  pdfmake.setLocalAccessPolicy((path) => path === fonts.normal || path === fonts.bold);
  return fitPdf(doc, (definition) => pdfmake.createPdf(definition).getBuffer());
}

// Each template's blank PDF is made once per build: the page and the .pdf route share it.
const blanks = new Map<DocumentSlug, Promise<{ output: Buffer; layout: SheetLayout }>>();

export function blankPdf(template: DocumentTemplate): Promise<{ output: Buffer; layout: SheetLayout }> {
  const made = blanks.get(template.slug) ?? pdfLayout(blankDocument(template));
  blanks.set(template.slug, made);
  return made;
}
