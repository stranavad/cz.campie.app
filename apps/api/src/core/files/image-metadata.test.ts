import { describe, expect, it } from 'vitest';

import { MAX_CAMP_PHOTO_BYTES } from '@repo/schema/camps';

import {
  ANIMATED_WEBP,
  BASELINE_JPEG,
  hex,
  ICC_PROFILE,
  JPEG_COMMENT,
  JPEG_DHT,
  JPEG_DQT,
  JPEG_EOI,
  JPEG_EXIF,
  JPEG_SCAN,
  JPEG_SOF0,
  JPEG_SOI,
  JPEG_SOS,
  JPEG_XMP,
  jpegSegment,
  latin1,
  LOSSLESS_WEBP,
  LOSSY_WEBP,
  PALETTE_PNG,
  png,
  PNG_IEND,
  PNG_SIGNATURE,
  pngChunk,
  PROGRESSIVE_JPEG,
  RGBA_PNG,
  riffChunk,
  webp,
  WEBP_VP8,
  WEBP_VP8L,
  webpFrame,
} from '../../testing/images.ts';
import { withoutMetadata } from './image-metadata.ts';

// JFIF 1.02, 72 dpi, with a 1x1 thumbnail of its own.
const JFIF_WITH_THUMBNAIL = jpegSegment(0xe0, hex('4a46494600 0102 01 0048 0048 01 01 ffffff'));
const JFIF = jpegSegment(0xe0, hex('4a46494600 0102 01 0048 0048 00 00'));
// The orientation of JPEG_EXIF, alone, big-endian: all the Exif a browser needs to turn the photo upright.
const ORIENTATION_ONLY = jpegSegment(
  0xe1,
  Buffer.concat([latin1('Exif\0\0'), hex('4d4d002a 00000008 0001 0112 0003 00000001 0006 0000 00000000')]),
);
const IPTC = jpegSegment(0xed, latin1('Photoshop 3.0\0Jana Testovaci'));
/**
 * A segment of a colour profile split over a JPEG's segments.
 * @param part which one, from 1
 * @param parts how many there are
 * @param data its part of the profile
 */
const iccSegment = (part: number, parts: number, data: Buffer) =>
  jpegSegment(0xe2, Buffer.concat([latin1('ICC_PROFILE\0'), Buffer.from([part, parts]), data]));
const ICC = iccSegment(1, 1, ICC_PROFILE);
const MPF = jpegSegment(0xe2, latin1('MPF\0second image'));
const ADOBE = jpegSegment(0xee, latin1('Adobe\0\x64\0\0\0\0\x01'));
// What phones append after the image: a second picture, a motion clip with its own location.
const TRAILER = latin1('ftypmp42 GPS 50.0755N');
const IHDR = pngChunk('IHDR', hex('00000001 00000001 08 06 00 00 00'));
const PICTURE = [JPEG_DQT, JPEG_SOF0, JPEG_DHT, JPEG_SOS, JPEG_SCAN];

describe('withoutMetadata', () => {
  it('keeps of a JPEG only the picture, its colours and its orientation', () => {
    const photo = Buffer.concat([
      JPEG_SOI,
      JFIF_WITH_THUMBNAIL,
      JPEG_EXIF,
      JPEG_XMP,
      ICC,
      MPF,
      IPTC,
      JPEG_COMMENT,
      ADOBE,
      ...PICTURE,
      JPEG_EOI,
      TRAILER,
    ]);

    expect(withoutMetadata('image/jpeg', photo)).toEqual(
      Buffer.concat([JPEG_SOI, JFIF, ORIENTATION_ONLY, ICC, ADOBE, ...PICTURE, JPEG_EOI]),
    );
  });

  it('drops the Exif of a JPEG whole when it holds no turn', () => {
    const upright = jpegSegment(0xe1, Buffer.concat([latin1('Exif\0\0'), hex('4d4d002a 00000008 0000 00000000')]));

    expect(withoutMetadata('image/jpeg', Buffer.concat([JPEG_SOI, upright, ...PICTURE, JPEG_EOI]))).toEqual(
      BASELINE_JPEG,
    );
  });

  it.each([
    ['a baseline JPEG', 'image/jpeg', BASELINE_JPEG],
    ['a progressive JPEG with restart markers', 'image/jpeg', PROGRESSIVE_JPEG],
    ['a palette PNG with a transparent colour', 'image/png', PALETTE_PNG],
    ['a PNG with alpha', 'image/png', RGBA_PNG],
    ['a lossy WebP', 'image/webp', LOSSY_WEBP],
    ['a lossless WebP', 'image/webp', LOSSLESS_WEBP],
    ['an animated WebP', 'image/webp', ANIMATED_WEBP],
  ] as const)('keeps %s without metadata as it is', (_case, contentType, bytes) => {
    expect(withoutMetadata(contentType, bytes)).toEqual(bytes);
  });

  it('keeps of a PNG only the chunks that draw it', () => {
    const [head, tail] = [PALETTE_PNG.subarray(0, 33), PALETTE_PNG.subarray(33)];
    const image = Buffer.concat([
      head,
      pngChunk('tEXt', latin1('Author\0Jana Testovaci')),
      pngChunk('eXIf', latin1('MM\0*GPS 50.0755N')),
      pngChunk('iTXt', latin1('XML:com.adobe.xmp\0\0\0\0\0GPS')),
      pngChunk('tIME', hex('07eb 07 04 0c 00 00')),
      tail.subarray(0, -12),
      pngChunk('zzZz', latin1('private')),
      PNG_IEND,
      TRAILER,
    ]);

    expect(withoutMetadata('image/png', image)).toEqual(PALETTE_PNG);
  });

  it('keeps of a WebP only the chunks that draw it, and no longer announces Exif or XMP', () => {
    const ICCP = riffChunk('ICCP', ICC_PROFILE);
    // Flags: ICC (0x20), Exif (0x08) and XMP (0x04); a 1x1 canvas.
    const image = webp(
      riffChunk('VP8X', hex('2c 000000 000000 000000')),
      ICCP,
      WEBP_VP8,
      riffChunk('EXIF', latin1('MM\0*GPS 50.0755N')),
      riffChunk('XMP ', latin1('<x:xmpmeta>GPS</x:xmpmeta>')),
    );

    expect(withoutMetadata('image/webp', Buffer.concat([image, TRAILER]))).toEqual(
      webp(riffChunk('VP8X', hex('20 000000 000000 000000')), ICCP, WEBP_VP8),
    );
  });

  // As large as an upload may be, built of the smallest parts there are, so a part that cost a new buffer
  // or a list entry each would take a second and hundreds of megabytes.
  const repeated = (part: Buffer) => Buffer.alloc(MAX_CAMP_PHOTO_BYTES - (MAX_CAMP_PHOTO_BYTES % part.length), part);

  it.each([
    ['temporary markers outside a scan', 'image/jpeg', [JPEG_SOI, repeated(hex('ff01')), ...PICTURE, JPEG_EOI]],
    ['restart markers outside a scan', 'image/jpeg', [JPEG_SOI, repeated(hex('ffd0')), ...PICTURE, JPEG_EOI]],
    ['empty restart intervals', 'image/jpeg', [JPEG_SOI, repeated(hex('ffdd 0002')), ...PICTURE, JPEG_EOI]],
    ['restart intervals', 'image/jpeg', [JPEG_SOI, repeated(hex('ffdd 0004 0001')), ...PICTURE, JPEG_EOI]],
    ['comments', 'image/jpeg', [JPEG_SOI, repeated(hex('fffe 0002')), ...PICTURE, JPEG_EOI]],
    [
      'gamma chunks',
      'image/png',
      [PALETTE_PNG.subarray(0, 33), repeated(pngChunk('gAMA', hex('0000b18f'))), PALETTE_PNG.subarray(33)],
    ],
    [
      'image data chunks',
      'image/png',
      [PALETTE_PNG.subarray(0, -12), repeated(pngChunk('IDAT', Buffer.alloc(0))), PNG_IEND],
    ],
    ['frames', 'image/webp', [webp(riffChunk('VP8X', hex('02 000000 000000 000000')), repeated(webpFrame(WEBP_VP8)))]],
  ] as const)('refuses an image of countless %s', (_case, contentType, parts) => {
    expect(withoutMetadata(contentType, Buffer.concat(parts))).toBeNull();
  });

  it.each([
    ['a JPEG cut short', 'image/jpeg', Buffer.concat([JPEG_SOI, JFIF, ...PICTURE])],
    ['a JPEG segment longer than the file', 'image/jpeg', Buffer.concat([JPEG_SOI, hex('ffdb 0100 01')])],
    ['a JPEG of bare bytes', 'image/jpeg', Buffer.concat([JPEG_SOI, latin1('<script>')])],
    ['a PNG without its end', 'image/png', Buffer.concat([PNG_SIGNATURE, IHDR])],
    ['a PNG not starting with its header', 'image/png', Buffer.concat([PNG_SIGNATURE, PNG_IEND])],
    ['a WebP longer than it says', 'image/webp', Buffer.concat([latin1('RIFF'), hex('ffffff00'), latin1('WEBP')])],
    ['a WebP that draws nothing', 'image/webp', webp(riffChunk('EXIF', latin1('MM\0*')))],
    ['a JPEG of no picture', 'image/jpeg', Buffer.concat([JPEG_SOI, JPEG_EOI])],
    ['a JPEG frame without a scan', 'image/jpeg', Buffer.concat([JPEG_SOI, JPEG_DQT, JPEG_SOF0, JPEG_DHT, JPEG_EOI])],
    [
      'a JPEG scan before its frame',
      'image/jpeg',
      Buffer.concat([JPEG_SOI, JPEG_DQT, JPEG_DHT, JPEG_SOS, JPEG_SCAN, JPEG_SOF0, JPEG_EOI]),
    ],
    ['a JPEG of two frames', 'image/jpeg', Buffer.concat([JPEG_SOI, JPEG_SOF0, ...PICTURE, JPEG_EOI])],
    [
      'an arithmetic-coded JPEG, which browsers do not draw',
      'image/jpeg',
      Buffer.concat([
        JPEG_SOI,
        JPEG_DQT,
        jpegSegment(0xc9, hex('08 0001 0001 01 01 11 00')),
        JPEG_SOS,
        JPEG_SCAN,
        JPEG_EOI,
      ]),
    ],
    ['a PNG that draws nothing', 'image/png', Buffer.concat([PNG_SIGNATURE, IHDR, PNG_IEND])],
    [
      'a PNG chunk with a wrong checksum',
      'image/png',
      Buffer.concat([PALETTE_PNG.subarray(0, -16), hex('00000000'), PNG_IEND]),
    ],
    [
      'a PNG of two gammas',
      'image/png',
      png(6, hex('2b8a4eff'), [pngChunk('gAMA', hex('0000b18f')), pngChunk('gAMA', hex('0000b18f'))]),
    ],
    [
      'a WebP frame that draws nothing',
      'image/webp',
      webp(riffChunk('VP8X', hex('02 000000 000000 000000')), riffChunk('ANIM', hex('ffffffff 0000')), webpFrame()),
    ],
    ['a lossy WebP without its start code', 'image/webp', webp(riffChunk('VP8 ', Buffer.alloc(18, 3)))],
  ] as const)('reads %s as no image', (_case, contentType, bytes) => {
    expect(withoutMetadata(contentType, bytes)).toBeNull();
  });
  // Text a part the picture is built of could carry, were it kept without being read.
  const TEXT = latin1('GPS 50.0755N 14.4378E Jana Testovaci');

  it.each([
    ['a reserved marker', 'image/jpeg', Buffer.concat([JPEG_SOI, jpegSegment(0x02, TEXT), ...PICTURE, JPEG_EOI])],
    ['another reserved marker', 'image/jpeg', Buffer.concat([JPEG_SOI, jpegSegment(0xbf, TEXT), ...PICTURE, JPEG_EOI])],
    ['a hierarchical frame', 'image/jpeg', Buffer.concat([JPEG_SOI, jpegSegment(0xde, TEXT), ...PICTURE, JPEG_EOI])],
    ['an expanded reference', 'image/jpeg', Buffer.concat([JPEG_SOI, jpegSegment(0xdf, TEXT), ...PICTURE, JPEG_EOI])],
    ['a number of lines', 'image/jpeg', Buffer.concat([JPEG_SOI, ...PICTURE, jpegSegment(0xdc, TEXT), JPEG_EOI])],
    ['the reserved JPG frame', 'image/jpeg', Buffer.concat([JPEG_SOI, jpegSegment(0xc8, TEXT), ...PICTURE, JPEG_EOI])],
    ['arithmetic conditioning', 'image/jpeg', Buffer.concat([JPEG_SOI, jpegSegment(0xcc, TEXT), ...PICTURE, JPEG_EOI])],
    [
      'text after a quantisation table',
      'image/jpeg',
      Buffer.concat([JPEG_SOI, jpegSegment(0xdb, Buffer.concat([JPEG_DQT.subarray(4), TEXT])), ...PICTURE, JPEG_EOI]),
    ],
    [
      'text after a Huffman table',
      'image/jpeg',
      Buffer.concat([JPEG_SOI, jpegSegment(0xc4, Buffer.concat([JPEG_DHT.subarray(4), TEXT])), ...PICTURE, JPEG_EOI]),
    ],
    [
      'text after a restart interval',
      'image/jpeg',
      Buffer.concat([JPEG_SOI, jpegSegment(0xdd, Buffer.concat([hex('0001'), TEXT])), ...PICTURE, JPEG_EOI]),
    ],
    [
      'text after a frame',
      'image/jpeg',
      Buffer.concat([
        JPEG_SOI,
        JPEG_DQT,
        jpegSegment(0xc0, Buffer.concat([JPEG_SOF0.subarray(4), TEXT])),
        JPEG_DHT,
        JPEG_SOS,
        JPEG_SCAN,
        JPEG_EOI,
      ]),
    ],
    [
      'text after a scan header',
      'image/jpeg',
      Buffer.concat([
        JPEG_SOI,
        JPEG_DQT,
        JPEG_SOF0,
        JPEG_DHT,
        jpegSegment(0xda, Buffer.concat([JPEG_SOS.subarray(4), TEXT])),
        JPEG_SCAN,
        JPEG_EOI,
      ]),
    ],
    ...['pHYs', 'bKGD', 'gAMA', 'cHRM', 'sBIT', 'tRNS', 'sRGB', 'cLLI'].map(
      (type) => [`text as ${type}`, 'image/png', png(2, hex('2b8a4e'), [pngChunk(type, TEXT)])] as const,
    ),
    ['a palette of no whole colours', 'image/png', png(3, hex('00'), [pngChunk('PLTE', hex('2b8a4e 00'))])],
    [
      'two extended headers',
      'image/webp',
      webp(
        riffChunk('VP8X', hex('00 000000 000000 000000')),
        riffChunk('VP8X', hex('00 000000 000000 000000')),
        WEBP_VP8,
      ),
    ],
    [
      'two colour profiles',
      'image/webp',
      webp(
        riffChunk('VP8X', hex('20 000000 000000 000000')),
        riffChunk('ICCP', ICC_PROFILE),
        riffChunk('ICCP', ICC_PROFILE),
        WEBP_VP8,
      ),
    ],
    [
      'alpha before a lossless bitstream, which holds its own',
      'image/webp',
      webp(riffChunk('VP8X', hex('10 000000 000000 000000')), riffChunk('ALPH', hex('00')), WEBP_VP8L),
    ],
    ['text as an extended header', 'image/webp', webp(riffChunk('VP8X', TEXT), WEBP_VP8)],
    [
      'text as an animation',
      'image/webp',
      webp(riffChunk('VP8X', hex('02 000000 000000 000000')), riffChunk('ANIM', TEXT), webpFrame(WEBP_VP8)),
    ],
  ] as const)('refuses an image with %s', (_case, contentType, bytes) => {
    expect(withoutMetadata(contentType, bytes)).toBeNull();
  });

  it("keeps of a JPEG's Adobe segment only its colour transform", () => {
    const adobe = jpegSegment(0xee, Buffer.concat([latin1('Adobe\0\x64\x80\0\0\0\x01'), TEXT]));

    expect(withoutMetadata('image/jpeg', Buffer.concat([JPEG_SOI, adobe, ...PICTURE, JPEG_EOI]))).toEqual(
      Buffer.concat([JPEG_SOI, ADOBE, ...PICTURE, JPEG_EOI]),
    );
  });

  it('drops the palette and the transparent colour an encoder wrote into a PNG with alpha', () => {
    const image = png(6, hex('2b8a4eff'), [pngChunk('PLTE', TEXT), pngChunk('tRNS', TEXT)]);

    expect(withoutMetadata('image/png', image)).toEqual(RGBA_PNG);
  });

  it('drops of a JPEG what claims to be part of a colour profile and is not, and keeps one split in parts', () => {
    const split = [iccSegment(1, 2, ICC_PROFILE.subarray(0, 64)), iccSegment(2, 2, ICC_PROFILE.subarray(64))];
    const photo = Buffer.concat([
      JPEG_SOI,
      ...split,
      iccSegment(1, 2, TEXT),
      iccSegment(3, 2, TEXT),
      iccSegment(0, 2, TEXT),
      jpegSegment(0xe2, latin1('ICC_PROFILE\0')),
      ...PICTURE,
      JPEG_EOI,
    ]);

    expect(withoutMetadata('image/jpeg', photo)).toEqual(Buffer.concat([JPEG_SOI, ...split, ...PICTURE, JPEG_EOI]));
  });

  it('drops of a WebP a colour profile that is none, and no longer announces it', () => {
    const image = webp(riffChunk('VP8X', hex('20 000000 000000 000000')), riffChunk('ICCP', TEXT), WEBP_VP8);

    expect(withoutMetadata('image/webp', image)).toEqual(
      webp(riffChunk('VP8X', hex('00 000000 000000 000000')), WEBP_VP8),
    );
  });

  it('keeps fill bytes before a restart marker inside a scan', () => {
    const photo = Buffer.concat([JPEG_SOI, ...PICTURE.slice(0, -1), hex('12 ffff d0 34'), JPEG_EOI]);

    expect(withoutMetadata('image/jpeg', photo)).toEqual(photo);
  });

  it('keeps of the frames of an animated WebP only what draws them', () => {
    const image = webp(
      riffChunk('VP8X', hex('02 000000 000000 000000')),
      riffChunk('ANIM', hex('ffffffff 0000')),
      webpFrame(WEBP_VP8, riffChunk('EXIF', TEXT)),
      webpFrame(riffChunk('XMP ', TEXT), WEBP_VP8L),
    );

    expect(withoutMetadata('image/webp', image)).toEqual(ANIMATED_WEBP);
  });
});
