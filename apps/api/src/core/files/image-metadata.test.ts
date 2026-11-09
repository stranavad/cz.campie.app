import { describe, expect, it } from 'vitest';

import { withoutMetadata } from './image-metadata.ts';

const hex = (value: string) => Buffer.from(value.replaceAll(' ', ''), 'hex');
const ascii = (value: string) => Buffer.from(value, 'latin1');

/**
 * A JPEG segment: its marker and a length that counts itself.
 * @param marker the marker's second byte
 * @param data the segment's data
 */
function segment(marker: number, data: Buffer): Buffer {
  const head = Buffer.alloc(4);
  head.writeUInt8(0xff, 0);
  head.writeUInt8(marker, 1);
  head.writeUInt16BE(data.length + 2, 2);

  return Buffer.concat([head, data]);
}

/**
 * A PNG chunk; the checksum is not checked, so it is left zero.
 * @param type the chunk's type
 * @param data the chunk's data
 */
function chunk(type: string, data: Buffer): Buffer {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);

  return Buffer.concat([length, ascii(type), data, Buffer.alloc(4)]);
}

/**
 * A RIFF chunk of a WebP file, padded to an even length.
 * @param fourcc the chunk's code
 * @param data the chunk's data
 */
function riffChunk(fourcc: string, data: Buffer): Buffer {
  const size = Buffer.alloc(4);
  size.writeUInt32LE(data.length);

  return Buffer.concat([ascii(fourcc), size, data, Buffer.alloc(data.length % 2)]);
}

function webp(...chunks: Buffer[]): Buffer {
  const body = Buffer.concat([ascii('WEBP'), ...chunks]);
  const size = Buffer.alloc(4);
  size.writeUInt32LE(body.length);

  return Buffer.concat([ascii('RIFF'), size, body]);
}

const SOI = hex('ffd8');
const EOI = hex('ffd9');
// JFIF 1.02, 72 dpi, with a 1x1 thumbnail of its own.
const JFIF_WITH_THUMBNAIL = segment(0xe0, hex('4a46494600 0102 01 0048 0048 01 01 ffffff'));
const JFIF = segment(0xe0, hex('4a46494600 0102 01 0048 0048 00 00'));
// Exif, little-endian, IFD0 with the camera's make, orientation 6 (turned right) and a GPS pointer.
const EXIF = segment(
  0xe1,
  Buffer.concat([
    ascii('Exif\0\0'),
    hex('49492a00 08000000 0300'),
    hex('0f01 0200 06000000 32000000'),
    hex('1201 0300 01000000 0600 0000'),
    hex('2588 0400 01000000 38000000'),
    hex('00000000'),
    ascii('Fotak\0'),
    ascii('GPS 50.0755N 14.4378E'),
  ]),
);
// The same orientation, alone, big-endian: all the Exif a browser needs to turn the photo upright.
const ORIENTATION_ONLY = segment(
  0xe1,
  Buffer.concat([ascii('Exif\0\0'), hex('4d4d002a 00000008 0001 0112 0003 00000001 0006 0000 00000000')]),
);
const XMP = segment(0xe1, ascii('http://ns.adobe.com/xap/1.0/\0<x:xmpmeta>GPS 50.0755N</x:xmpmeta>'));
const IPTC = segment(0xed, ascii('Photoshop 3.0\0Jana Testovaci'));
const COMMENT = segment(0xfe, ascii('Fotila Jana Testovaci'));
const ICC = segment(0xe2, ascii('ICC_PROFILE\0\x01\x01profile'));
const MPF = segment(0xe2, ascii('MPF\0second image'));
const ADOBE = segment(0xee, ascii('Adobe\0\x64\0\0\0\0\x01'));
const DQT = segment(0xdb, Buffer.alloc(65, 1));
const SOF0 = segment(0xc0, hex('08 0001 0001 01 01 11 00'));
const DHT = segment(0xc4, Buffer.alloc(20, 2));
const SOS = segment(0xda, hex('01 01 00 00 3f 00'));
// Entropy-coded data with a stuffed 0xff and a restart marker, which are part of the scan.
const SCAN = hex('1234 ff00 56 ffd0 78');
// What phones append after the image: a second picture, a motion clip with its own location.
const TRAILER = ascii('ftypmp42 GPS 50.0755N');

describe('withoutMetadata', () => {
  it('keeps of a JPEG only the picture, its colours and its orientation', () => {
    const photo = Buffer.concat([
      SOI,
      JFIF_WITH_THUMBNAIL,
      EXIF,
      XMP,
      ICC,
      MPF,
      IPTC,
      COMMENT,
      ADOBE,
      DQT,
      SOF0,
      DHT,
      SOS,
      SCAN,
      EOI,
      TRAILER,
    ]);

    expect(withoutMetadata('image/jpeg', photo)).toEqual(
      Buffer.concat([SOI, JFIF, ORIENTATION_ONLY, ICC, ADOBE, DQT, SOF0, DHT, SOS, SCAN, EOI]),
    );
  });

  it('drops the Exif of a JPEG whole when it holds no turn, and keeps every scan of a progressive one', () => {
    const upright = segment(0xe1, Buffer.concat([ascii('Exif\0\0'), hex('4d4d002a 00000008 0000 00000000')]));
    const photo = Buffer.concat([SOI, upright, DQT, SOF0, DHT, SOS, SCAN, DHT, SOS, SCAN, EOI]);

    expect(withoutMetadata('image/jpeg', photo)).toEqual(
      Buffer.concat([SOI, DQT, SOF0, DHT, SOS, SCAN, DHT, SOS, SCAN, EOI]),
    );
  });

  it('keeps of a PNG only the chunks that draw it', () => {
    const IHDR = chunk('IHDR', hex('00000001 00000001 08 06 00 00 00'));
    const SRGB = chunk('sRGB', hex('00'));
    const PHYS = chunk('pHYs', hex('00000b13 00000b13 01'));
    const IDAT = chunk('IDAT', hex('789c 6360 0000 0002 0001'));
    const IEND = chunk('IEND', Buffer.alloc(0));
    const image = Buffer.concat([
      hex('89504e470d0a1a0a'),
      IHDR,
      SRGB,
      chunk('tEXt', ascii('Author\0Jana Testovaci')),
      chunk('eXIf', ascii('MM\0*GPS 50.0755N')),
      chunk('iTXt', ascii('XML:com.adobe.xmp\0\0\0\0\0GPS')),
      chunk('tIME', hex('07eb 07 04 0c 00 00')),
      PHYS,
      IDAT,
      chunk('zzZz', ascii('private')),
      IEND,
      TRAILER,
    ]);

    expect(withoutMetadata('image/png', image)).toEqual(
      Buffer.concat([hex('89504e470d0a1a0a'), IHDR, SRGB, PHYS, IDAT, IEND]),
    );
  });

  it('keeps of a WebP only the chunks that draw it, and no longer announces Exif or XMP', () => {
    const ICCP = riffChunk('ICCP', ascii('profile'));
    const VP8 = riffChunk('VP8 ', Buffer.alloc(11, 3));
    // Flags: ICC (0x20), Exif (0x08) and XMP (0x04); a 1x1 canvas.
    const image = webp(
      riffChunk('VP8X', hex('2c 000000 000000 000000')),
      ICCP,
      VP8,
      riffChunk('EXIF', ascii('MM\0*GPS 50.0755N')),
      riffChunk('XMP ', ascii('<x:xmpmeta>GPS</x:xmpmeta>')),
    );

    expect(withoutMetadata('image/webp', Buffer.concat([image, TRAILER]))).toEqual(
      webp(riffChunk('VP8X', hex('20 000000 000000 000000')), ICCP, VP8),
    );
  });

  it.each([
    ['a JPEG cut short', 'image/jpeg', Buffer.concat([SOI, JFIF, DQT, SOF0, SOS, SCAN])],
    ['a JPEG segment longer than the file', 'image/jpeg', Buffer.concat([SOI, hex('ffdb 0100 01')])],
    ['a JPEG of bare bytes', 'image/jpeg', Buffer.concat([SOI, ascii('<script>')])],
    ['a PNG without its end', 'image/png', Buffer.concat([hex('89504e470d0a1a0a'), chunk('IHDR', Buffer.alloc(13))])],
    [
      'a PNG not starting with its header',
      'image/png',
      Buffer.concat([hex('89504e470d0a1a0a'), chunk('IEND', Buffer.alloc(0))]),
    ],
    ['a WebP longer than it says', 'image/webp', Buffer.concat([ascii('RIFF'), hex('ffffff00'), ascii('WEBP')])],
    ['a WebP that draws nothing', 'image/webp', webp(riffChunk('EXIF', ascii('MM\0*')))],
  ] as const)('reads %s as no image', (_case, contentType, bytes) => {
    expect(withoutMetadata(contentType, bytes)).toBeNull();
  });
});
