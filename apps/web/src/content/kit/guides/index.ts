import type { Guide, GuideSlug } from '../types.ts';
import { deti } from './deti.ts';
import { osobniUdaje } from './osobni-udaje.ts';
import { poradatel } from './poradatel.ts';
import { rezim } from './rezim.ts';
import { stravovani } from './stravovani.ts';
import { typAkce } from './typ-akce.ts';
import { ubytovani } from './ubytovani.ts';
import { vedouci } from './vedouci.ts';
import { vypis } from './vypis.ts';
import { zajezd } from './zajezd.ts';
import { zdravotnik } from './zdravotnik.ts';

// The guides in the order the hub lists them: what kind of event, who does what, then the place.
export const guides: readonly Guide[] = [
  typAkce,
  poradatel,
  deti,
  vedouci,
  vypis,
  zdravotnik,
  ubytovani,
  stravovani,
  rezim,
  osobniUdaje,
  zajezd,
];

export const guideBySlug = Object.fromEntries(guides.map((guide) => [guide.slug, guide])) as Record<GuideSlug, Guide>;
