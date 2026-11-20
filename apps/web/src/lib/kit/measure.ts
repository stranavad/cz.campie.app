import type { PrintDocument } from './document.ts';
import { measureHtml } from './preview.ts';
import { assignPages, chooseLayout, CONTENT, DENSITIES, PAGE, pageCount, type SheetLayout } from './sheet.ts';

// The configurator's pagination, without pdfmake: the document is set into an unseen page of real A4
// width (794 px, 96 dpi), at each density of the ladder in turn, and the heights of its head and units
// are read and put on pages as a printer would (sheet.ts). A small margin of safety makes the preview
// run on a little sooner than the PDF, never later.
const SAFETY = 0.985;

export function measureLayout(doc: PrintDocument, measurer: HTMLElement): SheetLayout {
  const tried: SheetLayout[] = [];
  for (let density = 0; density < DENSITIES.length; density += 1) {
    measurer.innerHTML = measureHtml(doc, density);
    const page = measurer.firstElementChild;
    const headEl = measurer.querySelector('.kp-head');
    if (page === null || headEl === null) {
      break;
    }
    const perPoint = page.getBoundingClientRect().width / PAGE.width;
    const height = (element: Element) => element.getBoundingClientRect().height / perPoint;
    const units = [...measurer.querySelectorAll('[data-unit]')].map(height);
    const unitPages = assignPages(height(headEl), units, CONTENT.height * SAFETY);
    const layout = { density, unitPages, pages: Math.max(1, ...unitPages) };
    tried.push(layout);
    if (pageCount(layout) === 1) {
      break;
    }
  }
  measurer.innerHTML = '';
  return chooseLayout(doc.kind, tried.length > 0 ? tried : [{ density: 0, unitPages: [], pages: 1 }]);
}
