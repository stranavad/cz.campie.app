import { documentLabels } from '../../content/kit/documents/index.ts';
import type { DocField } from '../../content/kit/documents/types.ts';
import { escapeHtml } from '../inline.ts';
import {
  fieldRows,
  paragraphs,
  printUnits,
  textRuns,
  titleOnLine,
  type PrintBlock,
  type PrintDocument,
} from './document.ts';
import { pageCount, type SheetLayout } from './sheet.ts';

// The document as HTML: A4 pages of paper, each a scaled PDF page, the same at build time (the page's
// static preview, paginated by the blank PDF's own layout) and in the browser (the configurator's,
// paginated by measuring). Pure functions to strings; every text is escaped, and the only URL is the
// logo, a JPEG data URL the settings schema has checked. The measures are in the stylesheet that
// sheet.ts writes from the PDF's constants.

const rich = (text: string) =>
  textRuns(text)
    .map((run) => (run.bold ? `<strong>${escapeHtml(run.text)}</strong>` : escapeHtml(run.text)))
    .join('');

const paras = (text: string, cls = '') =>
  paragraphs(text)
    .map((line) => `<p${cls === '' ? '' : ` class="${cls}"`}>${rich(line)}</p>`)
    .join('');

const line = '<div class="kp-line"></div>';

function field(item: DocField, share: number): string {
  const count = item.lines ?? 1;
  if (item.inline === true) {
    return `<div class="kp-field" data-share="${share}"><div class="kp-inline"><span class="s m">${escapeHtml(item.label)}</span>${line}</div>${line.repeat(count - 1)}</div>`;
  }
  const label = item.label === '' ? '' : `<div class="s m">${escapeHtml(item.label)}</div>`;
  return `<div class="kp-field" data-share="${share}">${label}${line.repeat(count)}</div>`;
}

function fields(items: readonly DocField[]): string {
  return `<div class="kp-rows">${fieldRows(items)
    .map(
      (row) =>
        `<div class="kp-row">${row.cells.map((cell) => field(cell.field, cell.share)).join('')}${
          row.lone ? '<div class="kp-field" data-share="0"></div>' : ''
        }</div>`,
    )
    .join('')}</div>`;
}

const check = (label: string) => `<span class="kp-check">${escapeHtml(label)}</span>`;

function block(item: PrintBlock): string {
  switch (item.type) {
    case 'heading':
      return `<div class="b kp-heading">${escapeHtml(item.text)}</div>`;
    case 'paragraph':
      return paras(item.text);
    case 'note':
      return `<div class="s m">${paras(item.text)}</div>`;
    case 'values':
      return item.lines
        .map(
          (entry) =>
            `<div><span class="m">${escapeHtml(entry.label)}:</span> <strong>${escapeHtml(entry.value)}</strong></div>`,
        )
        .join('');
    case 'fields':
      return fields(item.fields);
    case 'options':
      return `<div class="kp-options">${item.items.map((text) => `<div>${escapeHtml(text)}</div>`).join('')}</div>`;
    case 'box':
      if (titleOnLine(item)) {
        return `<div class="kp-box"><div class="kp-inline"><span class="b">${escapeHtml(item.title)}</span>${line}</div></div>`;
      }
      return `<div class="kp-box">${
        item.title === null ? '' : `<div class="b kp-box-title">${escapeHtml(item.title)}</div>`
      }${printUnits(item.blocks)
        .map((parts) => unit(parts))
        .join('')}</div>`;
    case 'item': {
      const { agree, disagree } = documentLabels.printed;
      const choice = item.kind === 'choice' ? `<span class="kp-choice">${check(agree)}${check(disagree)}</span>` : '';
      return `<div class="kp-item-head"><span class="kp-item-title">${item.number}. ${escapeHtml(item.title)}</span>${choice}</div><div class="kp-item-body">${paras(item.text)}</div>${
        item.fields.length > 0 ? `<div class="kp-item-fields">${fields(item.fields)}</div>` : ''
      }`;
    }
    case 'signature': {
      const { place_date: at, date } = documentLabels.printed;
      const signers = item.signers
        .map((signer) => `<div class="kp-signer">${line}<span class="s m">${escapeHtml(signer)}</span></div>`)
        .join('');
      return `<div class="kp-sign"><div class="kp-place"><span>${escapeHtml(at)}</span>${line}<span>${escapeHtml(date)}</span>${line}</div><div class="kp-signers">${signers}</div></div>`;
    }
  }
}

const unit = (parts: readonly PrintBlock[], index?: number) =>
  `<div class="ku"${index === undefined ? '' : ` data-unit="${index}"`}>${parts.map(block).join('')}</div>`;

function head(doc: PrintDocument): string {
  const letterhead =
    doc.letterhead === null
      ? ''
      : `<div class="kp-lh">${
          doc.letterhead.logo === null ? '' : `<img src="${escapeHtml(doc.letterhead.logo)}" alt="">`
        }<div><div class="name">${escapeHtml(doc.letterhead.name)}</div>${doc.letterhead.lines
          .map((entry) => `<div class="s m">${escapeHtml(entry)}</div>`)
          .join('')}</div></div>`;
  const subtitle = doc.subtitle === null ? '' : `<div class="kp-sub s m">${escapeHtml(doc.subtitle)}</div>`;
  return `<div class="kp-head">${letterhead}<div class="kp-title">${escapeHtml(doc.title)}</div>${subtitle}</div>`;
}

const sheet = (doc: PrintDocument, density: number, body: string, foot: string) =>
  `<div class="kp" data-kind="${doc.kind}" data-density="${density}">${body}${foot}</div>`;

// The pages of a document laid out as `layout` says: page n holds the units assigned to it, page 1
// opens with the head, and each page carries the PDF's footer.
export function previewHtml(doc: PrintDocument, layout: SheetLayout): string {
  const units = printUnits(doc.blocks);
  const total = pageCount(layout);
  return Array.from({ length: total }, (_, at) => {
    const number = at + 1;
    const body = units
      .filter((_part, index) => (layout.unitPages[index] ?? 1) === number)
      .map((parts) => unit(parts))
      .join('');
    const marker = total > 1 ? `${number} / ${total}` : '';
    const foot =
      doc.footer === null && marker === ''
        ? ''
        : `<div class="kp-foot"><span>${escapeHtml(doc.footer ?? '')}</span><span>${marker}</span></div>`;
    return sheet(doc, layout.density, `${number === 1 ? head(doc) : ''}${body}`, foot);
  }).join('');
}

// One page holding everything, for measuring: the head and each unit, marked so their heights can be
// read (lib/kit/measure.ts).
export function measureHtml(doc: PrintDocument, density: number): string {
  return sheet(doc, density, `${head(doc)}${printUnits(doc.blocks).map(unit).join('')}`, '');
}
