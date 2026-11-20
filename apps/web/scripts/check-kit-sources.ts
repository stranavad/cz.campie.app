// Checks the starter kit's citations against the sources themselves (docs/kit-content.md):
// - downloads every cited regulation from zakonyprolidi.cz (kept in node_modules/.tmp/kit-sources),
// - every cited anchor ("p9-3") must exist on its source's page,
// - every `quote` must stand word for word in one of the regulations its Fact cites,
// - every other source's address must answer.
//
//   node scripts/check-kit-sources.ts            use the downloaded copies, fetch what is missing
//   node scripts/check-kit-sources.ts --refresh  download everything again
//   node scripts/check-kit-sources.ts --dump     also write each regulation as plain text (<id>.txt)
//
// It proves that a citation points somewhere and that a quote is real. It does not prove that a
// statement says what the paragraph says: that is read by a person or a model, source beside Fact.
import { mkdir, readFile, writeFile } from 'node:fs/promises';

import { documents } from '../src/content/kit/documents/index.ts';
import { guides } from '../src/content/kit/guides/index.ts';
import { hub } from '../src/content/kit/hub.ts';
import { sources } from '../src/content/kit/sources.ts';
import type { Cite, Fact, Source, SourceId } from '../src/content/kit/types.ts';

const cacheDir = new URL('../node_modules/.tmp/kit-sources/', import.meta.url);
const refresh = process.argv.includes('--refresh');
const dump = process.argv.includes('--dump');
const registry: Record<SourceId, Source> = sources;

interface Located {
  where: string;
  fact: Fact;
}

const facts: Located[] = [
  ...guides.flatMap((guide) =>
    guide.sections.flatMap((section) => section.facts.map((fact) => ({ where: `${guide.slug}#${section.id}`, fact }))),
  ),
  ...hub.timeline.steps.flatMap((step) => step.facts.map((fact) => ({ where: `hub: ${step.when}`, fact }))),
  ...hub.changes.pending.facts.map((fact) => ({ where: 'hub: pending', fact })),
  ...documents.flatMap((template) => [
    ...template.explain.facts.map((fact) => ({ where: `${template.slug}: explain`, fact })),
    ...template.items.map((item) => ({ where: `${template.slug}: ${item.id}`, fact: item.why })),
  ]),
];

const cites: { where: string; cite: Cite }[] = [
  ...facts.flatMap(({ where, fact }) => fact.cites.map((cite) => ({ where, cite }))),
  ...[...hub.decision.columns, ...Object.values(hub.decision.notes)].flatMap((item) =>
    item.cites.map((cite) => ({ where: 'hub: decision', cite })),
  ),
];

const isStatute = (source: Source) => new URL(source.url).hostname === 'www.zakonyprolidi.cz';

async function download(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, { headers: { 'user-agent': 'kit-source-check' }, redirect: 'follow' });
    return response.ok ? await response.text() : null;
  } catch {
    return null;
  }
}

async function page(id: SourceId): Promise<string | null> {
  const file = new URL(`${id}.html`, cacheDir);
  if (!refresh) {
    try {
      return await readFile(file, 'utf8');
    } catch {
      // Not downloaded yet.
    }
  }
  const html = await download(registry[id].url);
  if (html !== null) {
    await writeFile(file, html);
  }
  return html;
}

const entities: Record<string, string> = { nbsp: ' ', amp: '&', quot: '"', lt: '<', gt: '>', bdquo: '„', ldquo: '“' };

// The page as the words a reader sees, in one line.
function plain(text: string): string {
  return (
    text
      .replace(/<(script|style)[\s\S]*?<\/\1>/g, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
      .replace(/&([a-z]+);/g, (whole: string, name: string) => entities[name] ?? whole)
      .replace(/\s+/g, ' ')
      .replace(/ ([,.;:)])/g, '$1')
      // Footnote marks: "zákonný zástupce dítěte 12) nebo".
      .replace(/ \d+[a-z]?\)/g, '')
      .replace(/ ([,.;:)])/g, '$1')
      .trim()
  );
}

await mkdir(cacheDir, { recursive: true });

const cited = [...new Set(cites.map(({ cite }) => cite.source))];
const problems: string[] = [];
const warnings: string[] = [];
const html = new Map<SourceId, string>();
const text = new Map<SourceId, string>();

for (const id of cited) {
  const source = registry[id];
  if (!isStatute(source)) {
    if ((await download(source.url)) === null) {
      warnings.push(`address does not answer (check by hand): ${id} ${source.url}`);
    }
    continue;
  }
  const content = await page(id);
  if (content === null) {
    problems.push(`cannot download ${id} ${source.url}`);
    continue;
  }
  html.set(id, content);
  text.set(id, plain(content));
  if (dump) {
    await writeFile(new URL(`${id}.txt`, cacheDir), plain(content));
  }
}

let anchors = 0;
for (const { where, cite } of cites) {
  const content = html.get(cite.source);
  if (cite.anchor === undefined || content === undefined) {
    continue;
  }
  anchors += 1;
  if (!content.includes(`id="${cite.anchor}"`)) {
    problems.push(`no such place: ${cite.source} ${cite.at ?? ''} #${cite.anchor} (${where})`);
  }
}

let quotes = 0;
for (const { where, fact } of facts) {
  if (fact.quote === undefined) {
    continue;
  }
  quotes += 1;
  const quote = plain(fact.quote);
  const statutes = fact.cites.map((cite) => text.get(cite.source)).filter((content) => content !== undefined);
  if (statutes.length === 0) {
    warnings.push(`quote from a source that is not a regulation, check by hand (${where}): "${quote.slice(0, 60)}..."`);
  } else if (!statutes.some((content) => content.includes(quote))) {
    problems.push(`quote not found word for word in the cited regulation (${where}): "${quote.slice(0, 80)}..."`);
  }
}

const unused = Object.keys(registry).filter((id) => !cited.some((used) => used === id));

const report = [
  ...warnings.map((line) => `warning: ${line}`),
  ...problems.map((line) => `PROBLEM: ${line}`),
  `${facts.length} facts, ${cites.length} citations, ${anchors} anchors and ${quotes} quotes checked, ` +
    `${problems.length} problems, ${warnings.length} warnings. Sources never cited: ${unused.join(', ') || 'none'}.`,
  `Downloaded regulations: ${cacheDir.pathname}`,
];
process.stdout.write(`${report.join('\n')}\n`);
process.exitCode = problems.length === 0 ? 0 : 1;
