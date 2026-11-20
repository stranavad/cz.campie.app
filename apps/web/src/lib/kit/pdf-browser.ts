import normal from '@expo-google-fonts/figtree/400Regular/Figtree_400Regular.ttf?url';
import bold from '@expo-google-fonts/figtree/700Bold/Figtree_700Bold.ttf?url';
import pdfmake from 'pdfmake';
import type { TDocumentDefinitions } from 'pdfmake/interfaces';

// The browser's PDF writer: the organiser's document, made on their device. The configurator imports
// this module only when a download is asked for, so pdfmake and the fonts are never part of the page.
// The fonts are this site's own files, fetched from the same origin. It takes the finished definition
// (pdf.ts), so this chunk holds the library and nothing of the page's own code.

export async function pdfBlob(definition: TDocumentDefinitions, font: string): Promise<Blob> {
  pdfmake.setFonts({
    [font]: { normal: new URL(normal, window.location.href).href, bold: new URL(bold, window.location.href).href },
  });
  return pdfmake.createPdf(definition).getBlob();
}

// Saves the PDF under the given name. The object URL lives only as long as the click needs it.
export function saveBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
