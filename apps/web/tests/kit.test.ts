import { describe, expect, it } from 'vitest';

import { templateBySlug } from '../src/content/kit/documents/index.ts';
import { guides } from '../src/content/kit/guides/index.ts';
import { hub } from '../src/content/kit/hub.ts';
import { sources } from '../src/content/kit/sources.ts';
import { czechDay, distance, parseDay, shiftDay } from '../src/lib/kit/deadlines.ts';
import { blankDocument, buildDocument, presetChoices } from '../src/lib/kit/document.ts';
import { citedSources, citeLink } from '../src/lib/kit/facts.ts';
import { hubPage, kitChanges } from '../src/lib/kit/pages.ts';
import { parseStored } from '../src/lib/kit/settings.ts';
import { assignPages, chooseLayout } from '../src/lib/kit/sheet.ts';

const allFacts = guides.flatMap((guide) => guide.sections.flatMap((section) => section.facts));

describe('the starter kit', () => {
  it('links a citation to its paragraph only where the source has anchors', () => {
    expect(citeLink({ source: 'z258', at: '§ 9 odst. 3', anchor: 'p9-3' })).toEqual({
      label: 'zák. č. 258/2000 Sb., § 9 odst. 3',
      href: `${sources.z258.url}#p9-3`,
    });
    expect(citeLink({ source: 'v400', at: '§ 1', anchor: 'p1' }).href).toBe(sources.v400.url);
  });

  it('lists every source a guide cites and no other', () => {
    for (const guide of guides) {
      const facts = guide.sections.flatMap((section) => section.facts);
      const cited = new Set(facts.flatMap((fact) => fact.cites.map((cite) => sources[cite.source].title)));
      const listed = citedSources(facts).flatMap((group) => group.sources.map((source) => source.label));
      expect(listed.toSorted()).toEqual([...cited].toSorted());
    }
  });

  it('derives the changes from the Facts: newest first, each once, each with the guide it comes from', () => {
    const groups = kitChanges();
    const dates = groups.map((group) => group.date);
    expect(dates).toEqual(dates.toSorted().toReversed());
    const listed = groups.flatMap((group) => group.changes);
    const expected = new Set(
      allFacts
        .filter((fact) => fact.since !== undefined && fact.since >= hub.changes.from)
        .flatMap((fact) => (fact.change === undefined ? [] : [fact.change])),
    );
    expect(listed.map((change) => change.fact.text).toSorted()).toEqual([...expected].toSorted());
    expect(listed.filter((change) => !change.origins[0]?.href.startsWith('/pruvodce/'))).toEqual([]);
  });

  it("counts the hub's rules from the Facts: all of them, and those that bind a smaller event too", () => {
    const [full, small] = hubPage().decision.columns;
    expect(full?.count.number).toBe(String(allFacts.length));
    expect(small?.count.number).toBe(String(allFacts.filter((fact) => fact.smallToo === true).length));
  });

  it("dates the timeline's steps from the camp's first day, a month back to the month's last day at most", () => {
    const start = parseDay('2027-03-31');
    if (start === null) {
      throw new Error('2027-03-31 is a day');
    }
    expect(czechDay(shiftDay(start, { months: -1 }))).toBe('28. 2. 2027');
    expect(czechDay(shiftDay(start, { months: -6 }))).toBe('30. 9. 2026');
    expect(czechDay(shiftDay(start, { days: -7 }))).toBe('24. 3. 2027');
    expect(parseDay('2027-02-30')).toBeNull();
    const labels = hub.timeline.calculator;
    const today = parseDay('2027-03-20') ?? start;
    expect([19, 20, 21, 23, 31].map((day) => distance(today, new Date(Date.UTC(2027, 2, day)), labels))).toEqual([
      'už proběhlo',
      'dnes',
      'zítra',
      'za 3 dny',
      'za 11 dní',
    ]);
  });
});

const settings = {
  organiser: { name: 'Spolek Zkušební', ico: '12345678', address: '', email: '', phone: '', logo: null },
  camp: { name: 'Tábor Zkouška', term: '', place: '' },
};

describe('the kit documents', () => {
  it('prints the preset of a blank template: default items only, no letterhead, no camp lines', () => {
    const template = templateBySlug['souhlasy-rodicu-na-tabor'];
    const doc = blankDocument(template);
    expect(doc.letterhead).toBeNull();
    expect(doc.blocks.filter((block) => block.type === 'values')).toEqual([]);
    const items = doc.blocks.flatMap((block) => (block.type === 'item' ? [block.title] : []));
    expect(items).toEqual(template.items.filter((item) => item.defaultOn).map((item) => item.title));
  });

  it("prints the organiser's choices: letterhead, camp lines, an edited text and an own item, numbered", () => {
    const template = templateBySlug['prohlaseni-o-bezinfekcnosti'];
    const doc = buildDocument(template, settings, {
      ...presetChoices(template),
      on: ['kontakt'],
      edits: { kontakt: { title: 'Telefon', text: 'Volejte mi.' } },
      custom: [{ id: 'a', title: 'Kapesné', text: 'Spravuje vedoucí.', kind: 'statement' }],
    });
    expect(doc.letterhead).toEqual({ logo: null, name: 'Spolek Zkušební', lines: ['IČO: 12345678'] });
    expect(doc.blocks.find((block) => block.type === 'values')).toEqual({
      type: 'values',
      lines: [{ label: 'Tábor', value: 'Tábor Zkouška' }],
    });
    const items = doc.blocks.flatMap((block) =>
      block.type === 'item' ? [[block.number, block.title, block.text]] : [],
    );
    expect(items).toEqual([
      [1, 'Telefon', 'Volejte mi.'],
      [2, 'Kapesné', 'Spravuje vedoucí.'],
    ]);
  });

  it('prints the prescribed form as it stands, whatever the organiser filled in', () => {
    const template = templateBySlug['posudek-o-zdravotni-zpusobilosti-ditete'];
    expect(buildDocument(template, settings, presetChoices(template))).toEqual(blankDocument(template));
  });

  it('drops stored settings that do not parse, such as an SVG logo', () => {
    const stored = {
      settings: { ...settings, organiser: { ...settings.organiser, logo: 'data:image/svg+xml;base64,PHN2Zz4=' } },
      templates: {},
    };
    expect(parseStored(JSON.stringify(stored)).settings.organiser.name).toBe('');
    const valid = { ...stored, settings };
    expect(parseStored(JSON.stringify(valid)).settings.organiser.name).toBe('Spolek Zkušební');
  });
});

describe('the kit pages', () => {
  it('puts a unit that does not fit on the next page, and a unit taller than a page on its own', () => {
    expect(assignPages(100, [300, 300, 200, 900, 50], 700)).toEqual([1, 1, 2, 3, 4]);
  });

  it('takes the roomiest one-page density, else the roomiest for a template and the fewest pages for the form', () => {
    const tried = [
      { density: 0, unitPages: [1, 3], pages: 3 },
      { density: 1, unitPages: [1, 2], pages: 2 },
      { density: 2, unitPages: [1, 2], pages: 2 },
    ];
    expect(chooseLayout('template', tried).density).toBe(0);
    expect(chooseLayout('form', tried).density).toBe(1);
    expect(chooseLayout('template', [...tried, { density: 3, unitPages: [1, 1], pages: 1 }]).density).toBe(3);
  });
});
