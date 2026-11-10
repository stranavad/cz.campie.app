import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import satori from 'satori';
import sharp from 'sharp';

import { icons } from '../content/icons.ts';
import { OG_IMAGE_SIZE } from './seo.ts';

// Build-time images: the Open Graph cards and the icons, all from the mark in content/icons.ts.

const FIRE = '#F26B21';
const FIRE_SOFT = '#FA8F4E';
const FOREST = '#163A2B';
const CREAM = '#F6F0E1';
const INK = '#16201A';
const NIGHT = '#0A0F0C';

// The mark: the tent, at half the circle's size, as the header draws it.
export function markSvg(size: number, background?: string): string {
  const circle = background === undefined ? size : size * 0.72;
  const offset = (size - circle) / 2;
  const scale = circle / 2 / 24;
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">`,
    background === undefined ? '' : `<rect width="${size}" height="${size}" fill="${background}"/>`,
    `<circle cx="${size / 2}" cy="${size / 2}" r="${circle / 2}" fill="${FIRE}"/>`,
    `<g transform="translate(${offset + circle / 4} ${offset + circle / 4}) scale(${scale})">`,
    `<path d="${icons.tent}" fill="none" stroke="${INK}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>`,
    '</g></svg>',
  ].join('');
}

export async function iconPng(size: number, background?: string): Promise<Buffer> {
  return sharp(Buffer.from(markSvg(size, background)), { density: 288 })
    .resize(size, size)
    .png()
    .toBuffer();
}

// favicon.ico: one 32px PNG in an ICO container (ICONDIR, one ICONDIRENTRY, the image).
export async function faviconIco(): Promise<Buffer> {
  const png = await iconPng(32);
  const header = Buffer.alloc(22);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(1, 4);
  header.writeUInt8(32, 6);
  header.writeUInt8(32, 7);
  header.writeUInt8(0, 8);
  header.writeUInt8(0, 9);
  header.writeUInt16LE(1, 10);
  header.writeUInt16LE(32, 12);
  header.writeUInt32LE(png.length, 14);
  header.writeUInt32LE(22, 18);
  return Buffer.concat([header, png]);
}

const require = createRequire(import.meta.url);

// Satori reads WOFF, not WOFF2, so the static Fontsource files; latin and latin-ext cover Czech. Each
// subset gets its own name, and the families list both: Satori falls back by name, not by unicode range.
const DISPLAY = 'Bricolage Grotesque, Bricolage Grotesque Ext';
const MONO = 'IBM Plex Mono, IBM Plex Mono Ext';

async function font(file: string): Promise<ArrayBuffer> {
  const data = await readFile(require.resolve(file));
  return data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
}

async function fonts() {
  const files = [
    ['Bricolage Grotesque', 800, '@fontsource/bricolage-grotesque/files/bricolage-grotesque-latin-800-normal.woff'],
    [
      'Bricolage Grotesque Ext',
      800,
      '@fontsource/bricolage-grotesque/files/bricolage-grotesque-latin-ext-800-normal.woff',
    ],
    ['IBM Plex Mono', 600, '@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-600-normal.woff'],
    ['IBM Plex Mono Ext', 600, '@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-ext-600-normal.woff'],
  ] as const;
  return Promise.all(
    files.map(async ([name, weight, file]) => ({ name, weight, style: 'normal' as const, data: await font(file) })),
  );
}

// Satori takes React elements; plain objects of the same shape do without React.
type Style = Record<string, string | number>;
interface Node {
  type: string;
  key: null;
  props: { style?: Style; children?: Node | Node[] | string; [attribute: string]: unknown };
}

const el = (type: string, style: Style, children?: Node['props']['children']): Node => ({
  type,
  key: null,
  props: { style, children },
});

function logo(): Node {
  const mark: Node = {
    type: 'svg',
    key: null,
    props: {
      width: 36,
      height: 36,
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: INK,
      strokeWidth: 2.5,
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
      children: { type: 'path', key: null, props: { d: icons.tent } },
    },
  };
  return el('div', { display: 'flex', alignItems: 'center', gap: 18 }, [
    el(
      'div',
      {
        width: 72,
        height: 72,
        borderRadius: 999,
        background: FIRE,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      },
      [mark],
    ),
    el('div', { fontFamily: DISPLAY, fontSize: 50, letterSpacing: '-0.03em', color: CREAM }, 'campie'),
  ]);
}

// The card shared on social networks: the logo, the page's eyebrow and its headline on the forest green.
export async function ogImage(eyebrow: string, title: string): Promise<Buffer> {
  const card = el(
    'div',
    {
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      padding: 72,
      background: FOREST,
    },
    [
      logo(),
      el('div', { display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 28 }, [
        el(
          'div',
          {
            display: 'flex',
            padding: '8px 22px',
            borderRadius: 999,
            background: FIRE_SOFT,
            color: NIGHT,
            fontFamily: MONO,
            fontSize: 26,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
          },
          eyebrow,
        ),
        el(
          'div',
          {
            maxWidth: 1000,
            fontFamily: DISPLAY,
            fontSize: 80,
            lineHeight: 1.02,
            letterSpacing: '-0.035em',
            color: CREAM,
          },
          title,
        ),
      ]),
    ],
  );
  const svg = await satori(card, { ...OG_IMAGE_SIZE, fonts: await fonts() });
  return sharp(Buffer.from(svg)).png().toBuffer();
}
