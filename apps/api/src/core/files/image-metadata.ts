import { crc32 } from 'node:zlib';

import type { FileContentType } from '@repo/schema/files';

export type ImageContentType = Extract<FileContentType, `image/${string}`>;

/**
 * Rewrite an image with only what draws it: no Exif, XMP, IPTC, comments, thumbnails or anything appended
 * after its end, so no location, camera or author leaves with a photo published from the camp. Whatever is
 * not known to be part of the picture is dropped, not the other way round. A JPEG keeps its orientation,
 * so a photo taken upright stays upright.
 * @param contentType the type its content was told to be
 * @param bytes the image
 * @returns the image without metadata, or null when it is not built like an image of its type
 */
export function withoutMetadata(contentType: ImageContentType, bytes: Buffer): Buffer | null {
  switch (contentType) {
    case 'image/jpeg':
      return jpegWithoutMetadata(bytes);
    case 'image/png':
      return pngWithoutMetadata(bytes);
    case 'image/webp':
      return webpWithoutMetadata(bytes);
  }
}

// More segments or chunks than any picture is built of; each costs a step and a kept part, so an upload of
// countless empty ones would cost seconds and hundreds of megabytes.
const MAX_PARTS = 10_000;
const DHT = 0xc4;
const EOI = 0xd9;
const SOS = 0xda;
const DQT = 0xdb;
const DRI = 0xdd;
const APP0 = 0xe0;
const APP1 = 0xe1;
const APP2 = 0xe2;
const APP14 = 0xee;
// Baseline, extended and progressive frames, Huffman-coded: what browsers draw. Lossless, hierarchical and
// arithmetic-coded frames are refused as no image to publish.
const FRAMES = new Set([0xc0, 0xc1, 0xc2]);

// What becomes of a JPEG segment: kept as it is or rewritten, dropped as no part of the picture, or the
// whole image refused as not built like a picture.
type SegmentFate = Buffer | 'dropped' | 'refused';

/**
 * Keep of a JPEG its frame, tables and scans, a thumbnail-free JFIF header, its colour profile, Adobe's
 * colour transform and its orientation; drop every other application segment, comments and anything after
 * its end. A segment a picture is built of is kept only when it holds exactly what its kind holds.
 * @param bytes the JPEG
 */
function jpegWithoutMetadata(bytes: Buffer): Buffer | null {
  if (bytes[0] !== 0xff || bytes[1] !== 0xd8) {
    return null;
  }

  const kept: Buffer[] = [bytes.subarray(0, 2)];
  const profileParts = new Set<number>();
  let framed = false;
  let scanned = false;
  let at = 2;

  for (let parts = 0; parts < MAX_PARTS && at < bytes.length; parts += 1) {
    if (bytes[at] !== 0xff) {
      return null;
    }

    // A marker may be preceded by any number of fill bytes.
    while (bytes[at] === 0xff) {
      at += 1;
    }

    const start = at - 1;
    const marker = bytes[at];
    at += 1;

    if (marker === EOI) {
      kept.push(bytes.subarray(start, at));

      return scanned ? Buffer.concat(kept) : null;
    }

    if (marker === undefined || at + 2 > bytes.length) {
      return null;
    }

    const length = bytes.readUInt16BE(at);

    if (length < 2 || at + length > bytes.length) {
      return null;
    }

    const data = bytes.subarray(at + 2, at + length);
    at += length;

    // One frame, and its scans after it.
    if ((FRAMES.has(marker) && framed) || (marker === SOS && !framed)) {
      return null;
    }

    const fate = segmentFate(marker, data, bytes.subarray(start, at), profileParts);

    if (fate === 'refused') {
      return null;
    }

    if (fate !== 'dropped') {
      kept.push(fate);
    }

    framed ||= FRAMES.has(marker);

    if (marker === SOS) {
      const scanEnd = endOfScan(bytes, at);
      kept.push(bytes.subarray(at, scanEnd));
      scanned = true;
      at = scanEnd;
    }
  }

  // No end of image, or more segments than a picture has.
  return null;
}

/**
 * Decide what becomes of a JPEG segment.
 * @param marker the segment's marker
 * @param data the segment's data, after its length
 * @param whole the segment as it is, marker and length included
 * @param profileParts the parts of a colour profile kept so far
 */
function segmentFate(marker: number, data: Buffer, whole: Buffer, profileParts: Set<number>): SegmentFate {
  if (FRAMES.has(marker)) {
    // Precision, height, width, the number of components and three bytes for each.
    return data.length >= 9 && data.length === 6 + 3 * (data[5] ?? 0) ? whole : 'refused';
  }

  switch (marker) {
    // Huffman tables: sixteen counts of codes, then that many values.
    case DHT:
      return tablesFill(data, (at) => 17 + sum(data.subarray(at + 1, at + 17))) ? whole : 'refused';
    // Quantisation tables of 64 values, of one byte or two.
    case DQT:
      return tablesFill(data, (at) => 1 + 64 * (((data[at] ?? 0) >> 4) + 1)) ? whole : 'refused';
    // The restart interval: one number.
    case DRI:
      return data.length === 2 ? whole : 'refused';
    // The scan's components, two bytes each, and its spectral selection and approximation.
    case SOS:
      return data.length === 1 + 2 * (data[0] ?? 0) + 3 && data[0] !== 0 ? whole : 'refused';
    // JFIF: its header without the thumbnail it may carry, which can show the photo before it was cropped.
    case APP0:
      return startsWith(data, 'JFIF\0') && data.length >= 14
        ? jpegSegment(marker, Buffer.concat([data.subarray(0, 12), Buffer.from([0, 0])]))
        : 'dropped';
    case APP1: {
      const orientation = startsWith(data, 'Exif\0\0') ? exifOrientation(data.subarray(6)) : null;

      return orientation === null ? 'dropped' : orientationExif(orientation);
    }
    // A part of the colour profile, each part once.
    case APP2: {
      const [part = 0, parts = 0] = data.subarray(12, 14);
      const profile =
        startsWith(data, 'ICC_PROFILE\0') &&
        part >= 1 &&
        part <= parts &&
        !profileParts.has(part) &&
        (part > 1 || isColourProfile(data.subarray(14)));

      if (!profile) {
        return 'dropped';
      }

      profileParts.add(part);

      return whole;
    }
    // Adobe's colour transform, which a CMYK or YCCK picture needs to be drawn in its colours; its flags
    // and anything after them go.
    case APP14: {
      const transform = data[11];

      return startsWith(data, 'Adobe') && transform !== undefined && transform <= 2
        ? jpegSegment(marker, Buffer.concat([Buffer.from('Adobe\0\x64\0\0\0\0', 'latin1'), Buffer.from([transform])]))
        : 'dropped';
    }
  }

  // Other application segments, comments and the JPGn extensions, which decoders skip.
  if ((marker >= 0xe0 && marker <= 0xef) || (marker >= 0xf0 && marker <= 0xfe)) {
    return 'dropped';
  }

  // Temporary and restart markers outside a scan, a second image, reserved markers, and segments of
  // frames browsers do not draw.
  return 'refused';
}

/**
 * Tell whether bytes begin like a colour profile. It is kept whole, or a wide-gamut photo is drawn in the
 * wrong colours; its own texts name the profile and its maker, not the photo.
 * @param bytes the profile, or its first part
 */
function isColourProfile(bytes: Buffer): boolean {
  return bytes.toString('latin1', 36, 40) === 'acsp';
}

/**
 * Tell whether a JPEG table segment is filled exactly by its tables, each starting with a byte of its
 * class or precision (0 or 1) and its destination (0 to 3).
 * @param data the segment's data
 * @param tableLength the length of the table starting at a position
 */
function tablesFill(data: Buffer, tableLength: (at: number) => number): boolean {
  let at = 0;

  while (at < data.length) {
    const head = data[at] ?? 0xff;

    if (head >> 4 > 1 || (head & 0x0f) > 3 || at + 17 > data.length) {
      return false;
    }

    at += tableLength(at);
  }

  return data.length > 0 && at === data.length;
}

/**
 * Add up bytes.
 * @param bytes the bytes
 */
function sum(bytes: Buffer): number {
  return bytes.reduce((total, byte) => total + byte, 0);
}

/**
 * Find where a JPEG scan's entropy-coded data ends: at the first marker that is not a stuffed 0xff or a
 * restart marker.
 * @param bytes the JPEG
 * @param from the first byte after the scan's header
 */
function endOfScan(bytes: Buffer, from: number): number {
  let at = from;

  while (at < bytes.length) {
    if (bytes[at] !== 0xff) {
      at += 1;
      continue;
    }

    // A marker may be preceded by fill bytes, inside a scan too.
    let next = at + 1;

    while (bytes[next] === 0xff) {
      next += 1;
    }

    const marker = bytes[next];

    if (marker !== undefined && marker !== 0x00 && !(marker >= 0xd0 && marker <= 0xd7)) {
      return at;
    }

    at = next + 1;
  }

  return bytes.length;
}

/**
 * Read the orientation of an Exif block's first image, when it is turned or mirrored.
 * @param tiff the Exif block after its `Exif\0\0` header
 * @returns 2 to 8, or null for upright or none
 */
function exifOrientation(tiff: Buffer): number | null {
  if (tiff.length < 8) {
    return null;
  }

  const order = tiff.toString('latin1', 0, 2);

  if (order !== 'II' && order !== 'MM') {
    return null;
  }

  const littleEndian = order === 'II';
  const u16 = (at: number) => (littleEndian ? tiff.readUInt16LE(at) : tiff.readUInt16BE(at));
  const u32 = (at: number) => (littleEndian ? tiff.readUInt32LE(at) : tiff.readUInt32BE(at));
  const ifd = u32(4);

  if (ifd + 2 > tiff.length) {
    return null;
  }

  const entries = u16(ifd);

  for (let index = 0; index < entries; index += 1) {
    const entry = ifd + 2 + index * 12;

    if (entry + 12 > tiff.length) {
      return null;
    }

    // Orientation, one SHORT.
    if (u16(entry) === 0x0112 && u16(entry + 2) === 3) {
      const orientation = u16(entry + 8);

      return orientation >= 2 && orientation <= 8 ? orientation : null;
    }
  }

  return null;
}

/**
 * Write an Exif segment that holds nothing but an orientation.
 * @param orientation 2 to 8
 */
function orientationExif(orientation: number): Buffer {
  const tiff = Buffer.alloc(26);
  tiff.write('MM', 0, 'latin1');
  tiff.writeUInt16BE(0x2a, 2);
  tiff.writeUInt32BE(8, 4);
  tiff.writeUInt16BE(1, 8);
  tiff.writeUInt16BE(0x0112, 10);
  tiff.writeUInt16BE(3, 12);
  tiff.writeUInt32BE(1, 14);
  tiff.writeUInt16BE(orientation, 18);

  return jpegSegment(0xe1, Buffer.concat([Buffer.from('Exif\0\0', 'latin1'), tiff]));
}

/**
 * Write a JPEG segment: its marker, a length that counts itself, and its data.
 * @param marker the marker's second byte
 * @param data the data
 */
function jpegSegment(marker: number, data: Buffer): Buffer {
  const head = Buffer.from([0xff, marker, 0, 0]);
  head.writeUInt16BE(data.length + 2, 2);

  return Buffer.concat([head, data]);
}

const PNG_SIGNATURE = Buffer.from('89504e470d0a1a0a', 'hex');

// What draws a PNG, its colours and its animation, each with the lengths its data may have for the image's
// colour type (0 grey, 2 RGB, 3 palette, 4 grey and alpha, 6 RGB and alpha); text, Exif, time stamps and
// private chunks go.
const PNG_KEPT_CHUNKS: Readonly<Record<string, (length: number, colourType: number) => boolean>> = {
  IHDR: (length) => length === 13,
  PLTE: (length) => length >= 3 && length <= 768 && length % 3 === 0,
  IDAT: () => true,
  IEND: (length) => length === 0,
  tRNS: (length, colourType) =>
    colourType === 3 ? length >= 1 && length <= 256 : length === { 0: 2, 2: 6 }[colourType],
  cHRM: (length) => length === 32,
  gAMA: (length) => length === 4,
  // The colour profile, compressed and kept whole, as in a JPEG.
  iCCP: (length) => length >= 3,
  sBIT: (length, colourType) => length === { 0: 1, 2: 3, 3: 3, 4: 2, 6: 4 }[colourType],
  sRGB: (length) => length === 1,
  cICP: (length) => length === 4,
  mDCV: (length) => length === 24,
  cLLI: (length) => length === 8,
  bKGD: (length, colourType) => length === { 0: 2, 2: 6, 3: 1, 4: 2, 6: 6 }[colourType],
  pHYs: (length) => length === 9,
  acTL: (length) => length === 8,
  fcTL: (length) => length === 26,
  fdAT: (length) => length >= 4,
};
// Chunks an image may hold more than one of; any other appears once.
const PNG_REPEATED_CHUNKS = new Set(['IDAT', 'fcTL', 'fdAT']);

/**
 * Keep of a PNG the chunks that draw it, from its header to its end, and nothing after. A kept chunk must
 * have its kind's length and a right checksum.
 * @param bytes the PNG
 */
function pngWithoutMetadata(bytes: Buffer): Buffer | null {
  if (!bytes.subarray(0, 8).equals(PNG_SIGNATURE)) {
    return null;
  }

  const kept: Buffer[] = [PNG_SIGNATURE];
  const seen = new Set<string>();
  let colourType = -1;
  let at = 8;

  for (let parts = 0; parts < MAX_PARTS && at + 8 <= bytes.length; parts += 1) {
    const length = bytes.readUInt32BE(at);
    const end = at + 12 + length;
    const type = bytes.toString('latin1', at + 4, at + 8);
    const validLength = PNG_KEPT_CHUNKS[type];

    if (end > bytes.length || (at === 8) !== (type === 'IHDR')) {
      return null;
    }

    if (validLength === undefined) {
      // An unknown chunk the image needs to be drawn (its type starts upper case) makes it no image to publish.
      if (type.charCodeAt(0) < 0x61) {
        return null;
      }

      at = end;
      continue;
    }

    // A palette suggested for an image of other colours, or a transparent colour for one with alpha of its
    // own, draws nothing.
    if ((type === 'PLTE' && colourType !== 3) || (type === 'tRNS' && (colourType === 4 || colourType === 6))) {
      at = end;
      continue;
    }

    if (
      !validLength(length, type === 'IHDR' ? 0 : colourType) ||
      (seen.has(type) && !PNG_REPEATED_CHUNKS.has(type)) ||
      crc32(bytes.subarray(at + 4, end - 4)) !== bytes.readUInt32BE(end - 4)
    ) {
      return null;
    }

    if (type === 'IHDR') {
      colourType = bytes[at + 17] ?? -1;
    }

    seen.add(type);
    kept.push(bytes.subarray(at, end));

    if (type === 'IEND') {
      return seen.has('IDAT') ? Buffer.concat(kept) : null;
    }

    at = end;
  }

  // No end of image, or more chunks than a picture has.
  return null;
}

// The extended header's flags announcing Exif (0x08) and XMP (0x04) chunks, and a colour profile (0x20).
const VP8X_METADATA_FLAGS = 0x0c;
const VP8X_PROFILE_FLAG = 0x20;
// Chunks a WebP holds at most once.
const WEBP_SINGLE_CHUNKS = new Set(['VP8X', 'ANIM', 'ICCP']);

interface RiffChunk {
  readonly fourcc: string;
  readonly data: Buffer;
  readonly whole: Buffer;
}

/**
 * Keep of a WebP the chunks that draw it, within the length its header gives, and stop announcing the
 * metadata it no longer holds. A kept chunk must be built like its kind, and an animation's frames keep only
 * their picture too.
 * @param bytes the WebP
 */
function webpWithoutMetadata(bytes: Buffer): Buffer | null {
  if (bytes.length < 12 || !startsWith(bytes, 'RIFF') || bytes.toString('latin1', 8, 12) !== 'WEBP') {
    return null;
  }

  const end = 8 + bytes.readUInt32LE(4);
  const parts = { left: MAX_PARTS };
  const chunks = end > bytes.length ? null : riffChunks(bytes.subarray(12, end), parts);

  if (chunks === null) {
    return null;
  }

  const kept: Buffer[] = [];
  const seen = new Set<string>();
  let header: Buffer | undefined;
  let profile = false;
  let frames = 0;

  for (const { fourcc, data, whole } of chunks) {
    if (WEBP_SINGLE_CHUNKS.has(fourcc) && seen.has(fourcc)) {
      return null;
    }

    seen.add(fourcc);

    if (fourcc === 'VP8X') {
      if (data.length !== 10) {
        return null;
      }

      header = Buffer.from(whole);
      kept.push(header);
    } else if (fourcc === 'ANIM') {
      if (data.length !== 6) {
        return null;
      }

      kept.push(whole);
    } else if (fourcc === 'ANMF') {
      // The frame's place, size, duration and flags, then its own chunks, of which only its picture stays.
      const picture = (data.length < 16 ? null : riffChunks(data.subarray(16), parts))?.filter(isPicture);

      if (picture === undefined || !isDrawable(picture)) {
        return null;
      }

      kept.push(riffChunk('ANMF', Buffer.concat([data.subarray(0, 16), ...picture.map((chunk) => chunk.whole)])));
      frames += 1;
    } else if (fourcc === 'ICCP' && isColourProfile(data)) {
      profile = true;
      kept.push(whole);
    } else if (isPicture({ fourcc })) {
      kept.push(whole);
    }
  }

  const still = chunks.filter(isPicture);

  // A still picture, or an animation's frames.
  if (still.length > 0 ? frames > 0 || !isDrawable(still) : frames === 0) {
    return null;
  }

  // The header no longer announces what was dropped.
  header?.writeUInt8(header.readUInt8(8) & ~(VP8X_METADATA_FLAGS | (profile ? 0 : VP8X_PROFILE_FLAG)), 8);

  return riffChunk('RIFF', Buffer.concat([Buffer.from('WEBP', 'latin1'), ...kept]));
}

/**
 * Read the chunks of a RIFF list, each padded to an even length.
 * @param bytes the list, without its header
 * @param parts how many more chunks the whole file may have
 * @returns null when a chunk runs past the list, or there are more than a picture has
 */
function riffChunks(bytes: Buffer, parts: { left: number }): RiffChunk[] | null {
  const chunks: RiffChunk[] = [];
  let at = 0;

  while (at < bytes.length) {
    parts.left -= 1;

    if (parts.left < 0 || at + 8 > bytes.length) {
      return null;
    }

    const size = bytes.readUInt32LE(at + 4);
    const end = at + 8 + size + (size % 2);

    if (end > bytes.length) {
      return null;
    }

    chunks.push({
      fourcc: bytes.toString('latin1', at, at + 4),
      data: bytes.subarray(at + 8, at + 8 + size),
      whole: bytes.subarray(at, end),
    });
    at = end;
  }

  return chunks;
}

/**
 * Tell whether a WebP chunk is part of a picture: its alpha or its lossy or lossless bitstream.
 * @param chunk the chunk
 */
function isPicture({ fourcc }: Pick<RiffChunk, 'fourcc'>): boolean {
  return fourcc === 'ALPH' || fourcc === 'VP8 ' || fourcc === 'VP8L';
}

/**
 * Tell whether the picture chunks of a WebP or of one of its frames draw it: one bitstream, starting the
 * way its kind does, and before a lossy one the alpha it may have.
 * @param picture the picture's chunks
 */
function isDrawable(picture: readonly RiffChunk[]): boolean {
  const bitstream = picture.at(-1);

  const alpha = picture.length === 2 ? picture[0] : undefined;

  if (
    bitstream === undefined ||
    picture.length > 2 ||
    (alpha !== undefined && (alpha.fourcc !== 'ALPH' || bitstream.fourcc !== 'VP8 '))
  ) {
    return false;
  }

  return bitstream.fourcc === 'VP8 '
    ? bitstream.data.length >= 10 && bitstream.data.subarray(3, 6).equals(VP8_START_CODE)
    : bitstream.fourcc === 'VP8L' && bitstream.data.length >= 5 && bitstream.data[0] === VP8L_SIGNATURE;
}

const VP8_START_CODE = Buffer.from('9d012a', 'hex');
const VP8L_SIGNATURE = 0x2f;

/**
 * Write a RIFF chunk, padded to an even length.
 * @param fourcc the chunk's code
 * @param data the data
 */
function riffChunk(fourcc: string, data: Buffer): Buffer {
  const head = Buffer.from(`${fourcc}\0\0\0\0`, 'latin1');
  head.writeUInt32LE(data.length, 4);

  return Buffer.concat([head, data, Buffer.alloc(data.length % 2)]);
}

/**
 * Tell whether bytes begin with a Latin-1 text.
 * @param bytes the bytes
 * @param text the text
 */
function startsWith(bytes: Buffer, text: string): boolean {
  return bytes.subarray(0, text.length).equals(Buffer.from(text, 'latin1'));
}
