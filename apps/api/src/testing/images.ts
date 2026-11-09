import { crc32, deflateSync } from 'node:zlib';

// Made-up images built the way cameras and encoders write them, with their metadata beside the picture.
// Every table, chunk and checksum is well formed, so only what a test changes makes one malformed. Built
// here rather than with the stripper's own writers, so a test's input never shares the code it tests.

export const hex = (value: string) => Buffer.from(value.replaceAll(' ', ''), 'hex');
export const latin1 = (value: string) => Buffer.from(value, 'latin1');

/**
 * A JPEG segment: its marker and a length that counts itself.
 * @param marker the marker's second byte
 * @param data the segment's data
 */
export function jpegSegment(marker: number, data: Buffer): Buffer {
  const head = Buffer.from([0xff, marker, 0, 0]);
  head.writeUInt16BE(data.length + 2, 2);

  return Buffer.concat([head, data]);
}

export const JPEG_SOI = hex('ffd8');
export const JPEG_EOI = hex('ffd9');
// One quantisation table of 8-bit values.
export const JPEG_DQT = jpegSegment(0xdb, Buffer.concat([hex('00'), Buffer.alloc(64, 1)]));
// The standard luminance DC table and an AC table holding only its end of block.
export const JPEG_DHT = jpegSegment(
  0xc4,
  Buffer.concat([
    hex('00 00010501010101010100000000000000 000102030405060708090a0b'),
    hex('10 01000000000000000000000000000000 00'),
  ]),
);
// A baseline frame of 1x1 pixel, one component.
export const JPEG_SOF0 = jpegSegment(0xc0, hex('08 0001 0001 01 01 11 00'));
export const JPEG_SOS = jpegSegment(0xda, hex('01 01 00 00 3f 00'));
// Entropy-coded data with a stuffed 0xff, which is part of the scan.
export const JPEG_SCAN = hex('1234 ff00 56 78');

// A baseline JPEG as an encoder writes it: tables, frame, one scan.
export const BASELINE_JPEG = Buffer.concat([JPEG_SOI, JPEG_DQT, JPEG_SOF0, JPEG_DHT, JPEG_SOS, JPEG_SCAN, JPEG_EOI]);

// A progressive JPEG of three components with a restart interval: a DC scan of all three, then an AC
// scan of each, the restart markers inside the scans.
export const PROGRESSIVE_JPEG = Buffer.concat([
  JPEG_SOI,
  JPEG_DQT,
  jpegSegment(0xc2, hex('08 0010 0010 03 01 22 00 02 11 00 03 11 00')),
  jpegSegment(0xdd, hex('0001')),
  JPEG_DHT,
  jpegSegment(0xda, hex('03 01 00 02 00 03 00 00 00 01')),
  hex('a1b2 ffd0 c3d4 ffd1 e5'),
  jpegSegment(0xda, hex('01 01 00 01 3f 00')),
  hex('0102 ff00 ffd2 03'),
  jpegSegment(0xda, hex('01 02 00 01 3f 00')),
  hex('0405 ffd3 06'),
  jpegSegment(0xda, hex('01 03 00 01 3f 00')),
  hex('0708 ffd4 09'),
  JPEG_EOI,
]);

// Exif, little-endian, IFD0 with the camera's make, orientation 6 (turned right) and a GPS pointer.
export const JPEG_EXIF = jpegSegment(
  0xe1,
  Buffer.concat([
    latin1('Exif\0\0'),
    hex('49492a00 08000000 0300'),
    hex('0f01 0200 06000000 32000000'),
    hex('1201 0300 01000000 0600 0000'),
    hex('2588 0400 01000000 38000000'),
    hex('00000000'),
    latin1('Fotak\0'),
    latin1('GPS 50.0755N 14.4378E'),
  ]),
);
export const JPEG_XMP = jpegSegment(0xe1, latin1('http://ns.adobe.com/xap/1.0/\0<x:xmpmeta>GPS 50.0755N</x:xmpmeta>'));
export const JPEG_COMMENT = jpegSegment(0xfe, latin1('Fotila Jana Testovaci'));

// The header of a colour profile without tags: its size and the signature every profile carries.
export const ICC_PROFILE = Buffer.concat([hex('00000084'), Buffer.alloc(32), latin1('acsp'), Buffer.alloc(92)]);

/**
 * A PNG chunk with its checksum.
 * @param type the chunk's type
 * @param data the chunk's data
 */
export function pngChunk(type: string, data: Buffer): Buffer {
  const body = Buffer.concat([latin1(type), data]);
  const head = Buffer.alloc(4);
  head.writeUInt32BE(data.length);

  const checksum = Buffer.alloc(4);
  checksum.writeUInt32BE(crc32(body));

  return Buffer.concat([head, body, checksum]);
}

export const PNG_SIGNATURE = hex('89504e470d0a1a0a');
export const PNG_IEND = pngChunk('IEND', Buffer.alloc(0));

/**
 * A 1x1 PNG.
 * @param colourType the IHDR's colour type
 * @param pixel the pixel's bytes after the row's filter byte
 * @param before the chunks between the header and the image data
 */
export function png(colourType: number, pixel: Buffer, before: Buffer[] = []): Buffer {
  return Buffer.concat([
    PNG_SIGNATURE,
    pngChunk('IHDR', Buffer.concat([hex('00000001 00000001 08'), Buffer.from([colourType]), hex('000000')])),
    ...before,
    pngChunk('IDAT', deflateSync(Buffer.concat([hex('00'), pixel]))),
    PNG_IEND,
  ]);
}

// A palette image with a transparent entry, its gamma, colour space and pixel size.
export const PALETTE_PNG = png(3, hex('01'), [
  pngChunk('gAMA', hex('0000b18f')),
  pngChunk('sRGB', hex('00')),
  pngChunk('PLTE', hex('000000 2b8a4e')),
  pngChunk('tRNS', hex('00')),
  pngChunk('pHYs', hex('00000b13 00000b13 01')),
]);
// A truecolour image with alpha.
export const RGBA_PNG = png(6, hex('2b8a4eff'));

/**
 * A RIFF chunk of a WebP file, padded to an even length.
 * @param fourcc the chunk's code
 * @param data the chunk's data
 */
export function riffChunk(fourcc: string, data: Buffer): Buffer {
  const size = Buffer.alloc(4);
  size.writeUInt32LE(data.length);

  return Buffer.concat([latin1(fourcc), size, data, Buffer.alloc(data.length % 2)]);
}

/**
 * A WebP file of chunks.
 * @param chunks its chunks
 */
export function webp(...chunks: Buffer[]): Buffer {
  const body = Buffer.concat([latin1('WEBP'), ...chunks]);
  const size = Buffer.alloc(4);
  size.writeUInt32LE(body.length);

  return Buffer.concat([latin1('RIFF'), size, body]);
}

// A lossy frame of 1x1: frame tag, start code, size, then the compressed data.
export const WEBP_VP8 = riffChunk('VP8 ', Buffer.concat([hex('300100 9d012a 0100 0100'), Buffer.alloc(8, 3)]));
// A lossless 1x1: its signature, then size and data.
export const WEBP_VP8L = riffChunk('VP8L', Buffer.concat([hex('2f 00000000'), Buffer.alloc(5, 7)]));
export const LOSSY_WEBP = webp(WEBP_VP8);
export const LOSSLESS_WEBP = webp(WEBP_VP8L);

/**
 * A frame of an animated WebP, at the top left of a 1x1 canvas for 100 ms.
 * @param chunks the frame's chunks
 */
export function webpFrame(...chunks: Buffer[]): Buffer {
  return riffChunk('ANMF', Buffer.concat([hex('000000 000000 000000 000000 640000 00'), ...chunks]));
}

// An animated WebP of two frames: extended header with the animation flag, a 1x1 canvas, looping forever.
export const ANIMATED_WEBP = webp(
  riffChunk('VP8X', hex('02 000000 000000 000000')),
  riffChunk('ANIM', hex('ffffffff 0000')),
  webpFrame(WEBP_VP8),
  webpFrame(WEBP_VP8L),
);
