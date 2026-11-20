// The printed page of a kit document, in PDF points: A4, its margins and the densities a document may
// be set at. The PDF (pdf.ts) and the HTML preview (preview.ts, through sheetCss) both take their
// measures from here, so a preview page is the PDF page scaled, and the two cannot drift apart.

export const PAGE = { width: 595.28, height: 841.89 } as const;
export const MARGIN = { side: 54, top: 46, bottom: 56 } as const;
export const CONTENT = {
  width: PAGE.width - 2 * MARGIN.side,
  height: PAGE.height - MARGIN.top - MARGIN.bottom,
} as const;

// Figtree's own line: (ascender - descender) / units per em. pdfmake multiplies it by `lineHeight`.
export const FONT_LINE = 1.2;

// The height of a signature line.
export const SIGNER = 30;

// Fixed measures, whatever the density.
export const MEASURE = {
  footerSize: 7.5,
  footerGap: 22,
  rule: 0.6,
  frame: 0.8,
  // The prescribed form's framed parts: their padding, the gap under a part's title and between the
  // units inside, and a heading's space above and below.
  boxPadX: 9,
  boxPadTop: 5,
  boxPadBottom: 5,
  boxTitleGap: 3,
  boxUnitGap: 3,
  headingTop: 0,
  headingBottom: 2,
  // The gap under the title; the form's is smaller.
  headGap: 10,
  formHeadGap: 6,
  columnGap: 16,
  // Between an inline field's label and its line, and between options side by side.
  inlineGap: 4,
  optionGap: 14,
  signatureGap: 36,
  checkbox: 9,
  logo: { width: 96, height: 56 },
  letterheadGap: 14,
  nameSize: 13,
} as const;

// One step of the ladder: type sizes, the height of a line to write on, and the gaps. A fill-in line
// stays at least 15 pt high (over 5 mm), enough to write on by hand.
export interface Density {
  body: number;
  small: number;
  title: number;
  formTitle: number;
  itemTitle: number;
  lineHeight: number;
  rule: number;
  fieldGap: number;
  unitGap: number;
}

// From the roomiest to the densest. The builder takes the roomiest step at which a document fits one
// page; the floor is 9 pt body text.
export const DENSITIES: readonly Density[] = [
  {
    body: 10.5,
    small: 8.5,
    title: 17,
    formTitle: 12.5,
    itemTitle: 11,
    lineHeight: 1.22,
    rule: 19,
    fieldGap: 7,
    unitGap: 10,
  },
  {
    body: 10,
    small: 8.25,
    title: 16,
    formTitle: 12,
    itemTitle: 10.5,
    lineHeight: 1.2,
    rule: 17.5,
    fieldGap: 6,
    unitGap: 8,
  },
  {
    body: 9.5,
    small: 8,
    title: 15,
    formTitle: 11.5,
    itemTitle: 10,
    lineHeight: 1.18,
    rule: 16,
    fieldGap: 5,
    unitGap: 7,
  },
  {
    body: 9,
    small: 7.75,
    title: 14,
    formTitle: 11,
    itemTitle: 9.5,
    lineHeight: 1.16,
    rule: 15,
    fieldGap: 4,
    unitGap: 6,
  },
];

// The prescribed form is set tighter at every step: its parts are framed, so they need less space
// between them, and its lines are closer.
const FORM = { fieldGap: 3, unitGap: 4 } as const satisfies Partial<Density>;

export function density(index: number, kind: 'form' | 'template'): Density {
  const found = DENSITIES[index];
  if (found === undefined) {
    throw new Error(`No density ${index}`);
  }
  return kind === 'form' ? { ...found, ...FORM } : found;
}

// Where a document's blocks land: the density it is set at, and the page of each unit (1-based).
export interface SheetLayout {
  density: number;
  unitPages: readonly number[];
  pages: number;
}

// Units on pages as a printer sets them: a unit that does not fit in what is left of a page starts
// the next one; a unit taller than a page stands alone on its own. Heights in points; the head (the
// letterhead and the title) opens page 1.
export function assignPages(head: number, units: readonly number[], available: number): number[] {
  let page = 1;
  let used = head;
  return units.map((height) => {
    if (used > 0 && used + height > available) {
      page += 1;
      used = 0;
    }
    used += height;
    return page;
  });
}

export const pageCount = (layout: SheetLayout) => layout.pages;

// The ladder's choice among the densities tried, in order: the roomiest at which the document is one
// page. A template that never fits takes the roomiest and runs on; the prescribed form, which a
// doctor fills in, takes the roomiest of those with the fewest pages, so its break falls between
// whole boxes.
export function chooseLayout(kind: 'form' | 'template', tried: readonly SheetLayout[]): SheetLayout {
  const first = tried[0];
  if (first === undefined) {
    throw new Error('No layout tried');
  }
  const single = tried.find((layout) => pageCount(layout) === 1);
  if (single !== undefined) {
    return single;
  }
  if (kind === 'template') {
    return first;
  }
  const fewest = Math.min(...tried.map(pageCount));
  return tried.find((layout) => pageCount(layout) === fewest) ?? first;
}

// The preview's stylesheet, written from the measures above. A page is the size container's width;
// 1 pt is that width / 595.28, so everything inside scales with the page. On a narrow screen the
// sheet keeps its pages but sets its text at a readable fixed size instead of scaling it down.
const n = (value: number) => Number(value.toFixed(3));
const pt = (value: number) => `calc(${n(value)} * var(--pt))`;

export function sheetCss(): string {
  const levels = DENSITIES.map(
    (step, index) =>
      `.kp[data-density="${index}"]{--body:${pt(step.body)};--small:${pt(step.small)};--title:${pt(step.title)};--form-title:${pt(step.formTitle)};--item-title:${pt(step.itemTitle)};--lh:${n(FONT_LINE * step.lineHeight)};--rule:${pt(step.rule)};--field-gap:${pt(step.fieldGap)};--unit-gap:${pt(step.unitGap)}}`,
  ).join('');
  const footerLine = MEASURE.footerSize * FONT_LINE * 1.2;
  return [
    `.kp-stack{container:kp/inline-size;display:flex;flex-direction:column;gap:20px}`,
    `.kp{--pt:calc(100cqw / ${PAGE.width});--pad-x:${pt(MARGIN.side)};--pad-top:${pt(MARGIN.top)};--pad-bottom:${pt(MARGIN.bottom)};position:relative;box-sizing:border-box;width:100%;aspect-ratio:${PAGE.width}/${PAGE.height};padding:var(--pad-top) var(--pad-x) var(--pad-bottom);background:var(--sheet);color:var(--sheet-ink);outline:1px solid var(--line);font-family:var(--font-sans);font-size:var(--body);line-height:var(--lh);text-align:left}`,
    levels,
    `.kp[data-kind="form"][data-density]{--field-gap:${pt(FORM.fieldGap)};--unit-gap:${pt(FORM.unitGap)}}`,
    `.kp *{margin:0;box-sizing:border-box}`,
    `.kp strong,.kp .b{font-weight:700}`,
    `.kp .m{color:var(--sheet-muted)}`,
    `.kp .s{font-size:var(--small)}`,
    `.ku{display:flow-root;padding-bottom:var(--unit-gap)}`,
    `.ku:last-child{padding-bottom:0}`,
    `.kp-head{display:flow-root;padding-bottom:${pt(MEASURE.headGap)}}`,
    `.kp[data-kind="form"] .kp-head{padding-bottom:${pt(MEASURE.formHeadGap)}}`,
    `.kp-lh{display:flex;align-items:center;gap:${pt(MEASURE.letterheadGap)};padding-bottom:${pt(9)};margin-bottom:${pt(13)};border-bottom:${pt(MEASURE.rule)} solid var(--sheet-rule)}`,
    `.kp-lh img{max-width:${pt(MEASURE.logo.width)};max-height:${pt(MEASURE.logo.height)};flex:none;object-fit:contain}`,
    `.kp-lh .name{font-size:${pt(MEASURE.nameSize)};font-weight:700}`,
    `.kp-title{font-size:var(--title);font-weight:700;line-height:${n(FONT_LINE * 1.1)}}`,
    `.kp[data-kind="form"] .kp-title{font-size:var(--form-title);text-align:center}`,
    `.kp-sub{padding-top:${pt(2)}}`,
    `.kp p+p{padding-top:${pt(3)}}`,
    `.kp-rows{display:flex;flex-direction:column}`,
    `.kp-row{display:flex;gap:${pt(MEASURE.columnGap)}}`,
    `.kp-field{flex:1 1 0;min-width:0;padding-bottom:var(--field-gap)}`,
    `.kp-field[data-share="2"]{flex-grow:2}`,
    `.kp-field[data-share="0"]{visibility:hidden}`,
    `.kp-line{height:calc(var(--rule) + ${pt(MEASURE.rule)});border-bottom:${pt(MEASURE.rule)} solid var(--sheet-rule)}`,
    `.kp-heading{padding:${pt(MEASURE.headingTop)} 0 ${pt(MEASURE.headingBottom)}}`,
    `.kp-box-title{padding-bottom:${pt(MEASURE.boxTitleGap)}}`,
    `.kp-options{display:flex;flex-wrap:wrap;column-gap:${pt(MEASURE.optionGap)};padding-left:${pt(10)}}`,
    `.kp-inline{display:flex;align-items:flex-end;gap:${pt(MEASURE.inlineGap)}}`,
    `.kp-inline>span{white-space:nowrap}`,
    `.kp-inline .kp-line{flex:1 1 0;min-width:${pt(48)}}`,
    `.kp-box{border:${pt(MEASURE.frame)} solid var(--sheet-ink);padding:${pt(MEASURE.boxPadTop)} ${pt(MEASURE.boxPadX)} ${pt(MEASURE.boxPadBottom)}}`,
    `.kp-box>.ku{padding-bottom:${pt(MEASURE.boxUnitGap)}}`,
    `.kp-box>.ku:last-child{padding-bottom:0}`,
    `.kp-item-head{display:flex;align-items:flex-start;gap:${pt(12)}}`,
    `.kp-item-title{flex:1;font-size:var(--item-title);font-weight:700}`,
    `.kp-choice{display:flex;gap:${pt(14)};flex:none;white-space:nowrap}`,
    `.kp-check{display:inline-flex;align-items:center;gap:${pt(4)}}`,
    `.kp-check::before{content:"";width:${pt(MEASURE.checkbox)};height:${pt(MEASURE.checkbox)};border:${pt(MEASURE.frame)} solid var(--sheet-ink)}`,
    `.kp-item-body{padding-top:${pt(2)}}`,
    `.kp-item-fields{padding-top:${pt(4)}}`,
    `.kp-sign{display:flex;gap:${pt(MEASURE.signatureGap)};align-items:flex-start;padding-top:${pt(8)}}`,
    `.kp-sign>*{flex:1 1 0;min-width:0}`,
    `.kp-place{display:flex;align-items:flex-end;gap:${pt(4)};padding-top:calc(${pt(SIGNER)} - var(--rule))}`,
    `.kp-place .kp-line{flex:1}`,
    `.kp-place .kp-line:last-child{flex:none;width:${pt(64)};margin-left:${pt(4)}}`,
    `.kp-signer+.kp-signer{padding-top:${pt(6)}}`,
    `.kp-signer .kp-line{height:${pt(SIGNER + MEASURE.rule)}}`,
    `.kp-signer span{display:block;text-align:center}`,
    `.kp-foot{position:absolute;left:var(--pad-x);right:var(--pad-x);bottom:${pt(MARGIN.bottom - MEASURE.footerGap - footerLine)};display:flex;justify-content:space-between;gap:${pt(12)};font-size:${pt(MEASURE.footerSize)};line-height:1.2;color:var(--sheet-muted)}`,
    `@container kp (width < 640px){.kp{--pt:1.4px;--pad-x:16px;--pad-top:20px;--pad-bottom:44px;aspect-ratio:auto}.kp-foot{bottom:14px}.kp-choice{white-space:normal;flex-wrap:wrap}.kp-inline{flex-wrap:wrap}.kp-inline>span{white-space:normal}.kp-inline .kp-line{flex-basis:40%}.kp-item-head{flex-wrap:wrap;row-gap:4px}.kp-item-title{flex-basis:100%}.kp-sign{flex-direction:column;align-items:stretch}.kp-place{padding-top:0}}`,
    `.kp-measure{position:absolute;left:-10000px;top:0;width:794px;visibility:hidden;pointer-events:none}`,
    `.kp-measure .kp{aspect-ratio:auto}`,
    `@media print{.kp-stack{display:block;container-type:normal}.kp{--pt:calc(210mm / ${PAGE.width});width:210mm;height:297mm;aspect-ratio:auto;outline:none;break-after:page;overflow:hidden}.kp:last-child{break-after:auto}}`,
  ].join('\n');
}
