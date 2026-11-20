import type { Column, Content, CustomTableLayout, Margins, TDocumentDefinitions } from 'pdfmake/interfaces';

import { documentLabels } from '../../content/kit/documents/index.ts';
import type { DocField } from '../../content/kit/documents/types.ts';
import {
  fieldRows,
  paragraphs,
  printUnits,
  textRuns,
  titleOnLine,
  type PrintBlock,
  type PrintDocument,
} from './document.ts';
import {
  chooseLayout,
  CONTENT,
  DENSITIES,
  density as densityAt,
  FONT_LINE,
  MARGIN,
  MEASURE,
  PAGE,
  SIGNER,
  type Density,
  type SheetLayout,
} from './sheet.ts';

// The PDF of a document as a pdfmake definition, at one density of the ladder (sheet.ts). A pure
// function, the same at build time (the blank PDFs) and in the browser (the organiser's). It knows
// nothing about where the fonts come from; the caller registers the family FONT under the two styles
// it uses. The preview (preview.ts) draws the same blocks with the same measures.

export const FONT = 'Figtree';

// Paper colours, not the site's: a PDF is printed in black and grey whatever the theme.
const INK = '#1a1a1a';
const MUTED = '#5c5c5c';
const RULE = '#7a7a7a';

// Left, top, right, bottom, in points.
const m = (left: number, top: number, right: number, bottom: number): Margins => [left, top, right, bottom];

// What pdfmake reports while it lays the document out: the page each unit starts on.
export interface LayoutProbe {
  unitPages: number[];
  pages: number;
}

interface Context {
  d: Density;
  // The width the block is set in, in points.
  width: number;
}

// A line to write on: an empty row of a borderless table with only its bottom rule.
const writeLine: CustomTableLayout = {
  hLineWidth: (index) => (index === 0 ? 0 : MEASURE.rule),
  vLineWidth: () => 0,
  hLineColor: () => RULE,
  paddingLeft: () => 0,
  paddingRight: () => 0,
  paddingTop: () => 0,
  paddingBottom: () => 0,
};

function lines(count: number, height: number): Content {
  return {
    table: { widths: ['*'], heights: height, body: Array.from({ length: count }, () => [{ text: '' }]) },
    layout: writeLine,
  };
}

function rule(width: number, top: number, bottom: number): Content {
  return {
    canvas: [{ type: 'line', x1: 0, y1: 0, x2: width, y2: 0, lineWidth: MEASURE.rule, lineColor: RULE }],
    margin: m(0, top, 0, bottom),
  };
}

const frame: CustomTableLayout = {
  hLineWidth: () => MEASURE.frame,
  vLineWidth: () => MEASURE.frame,
  hLineColor: () => INK,
  vLineColor: () => INK,
  paddingLeft: () => MEASURE.boxPadX,
  paddingRight: () => MEASURE.boxPadX,
  paddingTop: () => MEASURE.boxPadTop,
  paddingBottom: () => MEASURE.boxPadBottom,
};

function richText(text: string) {
  return textRuns(text).map((run) => (run.bold ? { text: run.text, bold: true } : run.text));
}

// Paragraphs of a text, 3 pt apart.
const paras = (text: string, extra: { fontSize?: number; color?: string } = {}): Content[] =>
  paragraphs(text).map((line, index) => ({ text: richText(line), margin: m(0, index === 0 ? 0 : 3, 0, 0), ...extra }));

// A label set on a line's left, the line filling the rest of the row; the label is pushed down by the
// line's height less its own, so it stands on the line.
function onLine(text: string, style: { fontSize: number; color?: string; bold?: boolean }, d: Density): Content {
  return {
    columns: [
      {
        width: 'auto',
        text,
        noWrap: true,
        margin: m(0, Math.max(0, d.rule - style.fontSize * FONT_LINE * d.lineHeight), 0, 0),
        ...style,
      },
      { width: '*', stack: [lines(1, d.rule)] },
    ],
    columnGap: MEASURE.inlineGap,
  };
}

function field(item: DocField, ctx: Context): Content {
  const { d } = ctx;
  const count = item.lines ?? 1;
  if (item.inline === true) {
    return {
      stack: [
        onLine(item.label, { fontSize: d.small, color: MUTED }, d),
        ...(count > 1 ? [lines(count - 1, d.rule)] : []),
      ],
      margin: m(0, 0, 0, d.fieldGap),
    };
  }
  const label: Content[] = item.label === '' ? [] : [{ text: item.label, fontSize: d.small, color: MUTED }];
  return { stack: [...label, lines(count, d.rule)], margin: m(0, 0, 0, d.fieldGap) };
}

// Rows of fields, each cell as wide as its share of the row (document.ts).
function fields(items: readonly DocField[], ctx: Context): Content {
  return {
    stack: fieldRows(items).map((row) => {
      const cells = row.lone ? [...row.cells, null] : row.cells;
      const shares = cells.reduce((sum, cell) => sum + (cell?.share ?? 1), 0);
      const free = ctx.width - MEASURE.columnGap * (cells.length - 1);
      if (cells.length === 1 && cells[0] !== null && cells[0] !== undefined) {
        return field(cells[0].field, ctx);
      }
      return {
        columns: cells.map((cell): Column => ({
          width: (free * (cell?.share ?? 1)) / shares,
          stack: cell === null ? [] : [field(cell.field, ctx)],
        })),
        columnGap: MEASURE.columnGap,
      };
    }),
  };
}

function checkbox(label: string): Column[] {
  return [
    {
      width: MEASURE.checkbox + 4,
      canvas: [
        {
          type: 'rect',
          x: 0,
          y: 1.5,
          w: MEASURE.checkbox,
          h: MEASURE.checkbox,
          lineWidth: MEASURE.frame,
          lineColor: INK,
        },
      ],
    },
    { width: 'auto', text: label },
  ];
}

function block(item: PrintBlock, ctx: Context): Content {
  const { d } = ctx;
  switch (item.type) {
    case 'heading':
      return { text: item.text, bold: true, margin: m(0, MEASURE.headingTop, 0, MEASURE.headingBottom) };
    case 'paragraph':
      return { stack: paras(item.text) };
    case 'note':
      return { stack: paras(item.text, { fontSize: d.small, color: MUTED }) };
    case 'values':
      return {
        stack: item.lines.map((line) => ({
          text: [
            { text: `${line.label}: `, color: MUTED },
            { text: line.value, bold: true },
          ],
        })),
      };
    case 'fields':
      return fields(item.fields, ctx);
    case 'options':
      return {
        columns: item.items.map((text): Column => ({ width: 'auto', text })),
        columnGap: MEASURE.optionGap,
        margin: m(10, 0, 0, 0),
      };
    case 'box': {
      const inner = { d, width: ctx.width - 2 * MEASURE.boxPadX - 2 * MEASURE.frame };
      const units = printUnits(item.blocks);
      if (titleOnLine(item)) {
        return {
          table: { widths: ['*'], body: [[onLine(item.title, { fontSize: d.body, bold: true }, d)]] },
          layout: frame,
        };
      }
      return {
        table: {
          widths: ['*'],
          body: [
            [
              {
                stack: [
                  ...(item.title === null
                    ? []
                    : [{ text: item.title, bold: true, margin: m(0, 0, 0, MEASURE.boxTitleGap) }]),
                  ...units.map((unit, index): Content => ({
                    stack: unit.map((part) => block(part, inner)),
                    margin: m(0, 0, 0, index === units.length - 1 ? 0 : MEASURE.boxUnitGap),
                  })),
                ],
              },
            ],
          ],
        },
        layout: frame,
      };
    }
    case 'item': {
      const { agree, disagree } = documentLabels.printed;
      const choice: Column[] =
        item.kind === 'choice' ? [...checkbox(agree), { width: 14, text: '' }, ...checkbox(disagree)] : [];
      return {
        stack: [
          {
            columns: [
              { width: '*', text: `${item.number}. ${item.title}`, bold: true, fontSize: d.itemTitle },
              ...(choice.length > 0 ? [{ width: 12, text: '' }, ...choice] : []),
            ],
          },
          { stack: paras(item.text), margin: m(0, 2, 0, 0) },
          ...(item.fields.length > 0 ? [{ stack: [fields(item.fields, ctx)], margin: m(0, 4, 0, 0) }] : []),
        ],
      };
    }
    case 'signature': {
      const { place_date: at, date } = documentLabels.printed;
      const half = (ctx.width - MEASURE.signatureGap) / 2;
      // The words sit on the lines: they are pushed down by the line's height less their own.
      const textTop = Math.max(0, d.rule - d.body * FONT_LINE * d.lineHeight);
      const signer = SIGNER;
      return {
        columns: [
          {
            width: half,
            columns: [
              { width: 'auto', text: at, margin: m(0, textTop, 0, 0) },
              { width: '*', stack: [lines(1, d.rule)] },
              { width: 'auto', text: date, margin: m(4, textTop, 0, 0) },
              { width: 64, stack: [lines(1, d.rule)] },
            ],
            columnGap: 4,
            margin: m(0, signer - d.rule, 0, 0),
          },
          { width: MEASURE.signatureGap, text: '' },
          {
            width: half,
            stack: item.signers.map((name, index) => ({
              stack: [lines(1, signer), { text: name, fontSize: d.small, color: MUTED, alignment: 'center' as const }],
              margin: m(0, index === 0 ? 0 : 6, 0, 0),
            })),
          },
        ],
        margin: m(0, 8, 0, 0),
      };
    }
  }
}

function head(doc: PrintDocument, d: Density): Content {
  const isForm = doc.kind === 'form';
  const letterhead: Content[] =
    doc.letterhead === null
      ? []
      : [
          {
            columns: [
              ...(doc.letterhead.logo === null
                ? []
                : [
                    {
                      width: 'auto',
                      stack: [{ image: doc.letterhead.logo, fit: [MEASURE.logo.width, MEASURE.logo.height] }],
                    } satisfies Column,
                  ]),
              {
                width: '*',
                stack: [
                  { text: doc.letterhead.name, bold: true, fontSize: MEASURE.nameSize },
                  ...doc.letterhead.lines.map((line) => ({ text: line, fontSize: d.small, color: MUTED })),
                ],
              },
            ],
            columnGap: MEASURE.letterheadGap,
          },
          rule(CONTENT.width, 9, 13),
        ];
  return {
    stack: [
      ...letterhead,
      {
        text: doc.title,
        bold: true,
        fontSize: isForm ? d.formTitle : d.title,
        alignment: isForm ? 'center' : 'left',
        lineHeight: 1.1,
      },
      ...(doc.subtitle === null
        ? []
        : [{ text: doc.subtitle, fontSize: d.small, color: MUTED, margin: m(0, 2, 0, 0) }]),
    ],
    margin: m(0, 0, 0, isForm ? MEASURE.formHeadGap : MEASURE.headGap),
  };
}

// The definition at density `index` of the ladder. Each unit is kept on one page and carries an id,
// through which `probe` learns where pdfmake put it.
export function pdfDefinition(doc: PrintDocument, index: number, probe?: LayoutProbe): TDocumentDefinitions {
  const d = densityAt(index, doc.kind);
  const ctx: Context = { d, width: CONTENT.width };
  const units = printUnits(doc.blocks);
  return {
    pageSize: { width: PAGE.width, height: PAGE.height },
    pageMargins: [MARGIN.side, MARGIN.top, MARGIN.side, MARGIN.bottom],
    info: { title: doc.title, creator: 'campie.cz', producer: 'campie.cz' },
    defaultStyle: { font: FONT, fontSize: d.body, lineHeight: d.lineHeight, color: INK },
    content: [
      head(doc, d),
      // pdfmake reports a node's `id` to pageBreakBefore; its types know it on text nodes only.
      ...units.map((unit, at): Content =>
        Object.assign(
          {
            stack: unit.map((part) => block(part, ctx)),
            margin: m(0, 0, 0, at === units.length - 1 ? 0 : d.unitGap),
            unbreakable: true,
          },
          { id: `u${at}` },
        ),
      ),
    ],
    footer: (page, pages) => {
      if (probe !== undefined) {
        probe.pages = pages;
      }
      return {
        columns: [
          { width: '*', text: doc.footer ?? '' },
          { width: 'auto', text: pages > 1 ? `${page} / ${pages}` : '' },
        ],
        fontSize: MEASURE.footerSize,
        lineHeight: 1.2,
        color: MUTED,
        margin: m(MARGIN.side, MEASURE.footerGap, MARGIN.side, 0),
      };
    },
    pageBreakBefore: (node) => {
      const unit = /^u(\d+)$/.exec(node.id ?? '');
      const page = node.pageNumbers[0];
      if (probe !== undefined && unit !== null && page !== undefined) {
        probe.unitPages[Number(unit[1])] = page;
      }
      return false;
    },
  };
}

// The ladder: the document is set at each density in turn until it fits one page, and the choice
// (sheet.ts) is rendered. `render` writes a definition with pdfmake, in Node or in the browser.
export async function fitPdf<T>(
  doc: PrintDocument,
  render: (definition: TDocumentDefinitions) => Promise<T>,
): Promise<{ output: T; layout: SheetLayout }> {
  const tried: SheetLayout[] = [];
  const outputs: T[] = [];
  for (let index = 0; index < DENSITIES.length; index += 1) {
    const probe: LayoutProbe = { unitPages: [], pages: 1 };
    outputs.push(await render(pdfDefinition(doc, index, probe)));
    const units = printUnits(doc.blocks).length;
    const unitPages = Array.from({ length: units }, (_, at) => probe.unitPages[at] ?? 1);
    // The footer counts every page pdfmake made, an empty one included.
    const layout = { density: index, unitPages, pages: Math.max(probe.pages, ...unitPages) };
    tried.push(layout);
    if (layout.pages === 1) {
      break;
    }
  }
  const layout = chooseLayout(doc.kind, tried);
  const output = outputs[layout.density];
  if (output === undefined) {
    throw new Error('The chosen density was not rendered');
  }
  return { output, layout };
}

// The file name the browser saves a document under.
export function pdfFileName(doc: PrintDocument): string {
  return `${doc.slug}.pdf`;
}
