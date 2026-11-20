import type { Cite, SourceId } from './types.ts';

// A citation of a paragraph of a regulation on zakonyprolidi.cz: par('z258', '9', '3') reads
// "§ 9 odst. 3" and links the anchor "p9-3"; with a letter, par('z258', '11', '1', 'e') reads
// "§ 11 odst. 1 písm. e)" and links "p11-1-e".
export function par(source: SourceId, paragraph: string, odstavec?: string, pismeno?: string): Cite {
  const parts = [paragraph, odstavec, pismeno].filter((part) => part !== undefined);
  const odst = odstavec === undefined ? '' : ` odst. ${odstavec}`;
  const pism = pismeno === undefined ? '' : ` písm. ${pismeno})`;
  return { source, at: `§ ${paragraph}${odst}${pism}`, anchor: `p${parts.join('-')}` };
}

// A citation of another place in a source: an annex, an article, or the source as a whole.
export function at(source: SourceId, place?: string): Cite {
  return place === undefined ? { source } : { source, at: place };
}
