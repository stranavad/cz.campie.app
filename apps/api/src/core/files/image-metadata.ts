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

// Markers that stand alone, without a length: TEM and the restart markers.
const STANDALONE_MARKERS = new Set([0x01, 0xd0, 0xd1, 0xd2, 0xd3, 0xd4, 0xd5, 0xd6, 0xd7]);
const SOS = 0xda;
const EOI = 0xd9;
const COM = 0xfe;

/**
 * Keep of a JPEG its frame, tables and scans, a thumbnail-free JFIF header, its colour profile, Adobe's
 * colour transform and its orientation; drop every other application segment, comments and anything after
 * its end.
 * @param bytes the JPEG
 */
function jpegWithoutMetadata(bytes: Buffer): Buffer | null {
  if (bytes[0] !== 0xff || bytes[1] !== 0xd8) {
    return null;
  }

  const kept: Buffer[] = [bytes.subarray(0, 2)];
  let at = 2;

  while (at < bytes.length) {
    if (bytes[at] !== 0xff) {
      return null;
    }

    // A marker may be preceded by any number of fill bytes.
    while (bytes[at] === 0xff) {
      at += 1;
    }

    const marker = bytes[at];
    at += 1;

    if (marker === undefined || marker === 0x00 || marker === 0xd8) {
      return null;
    }

    if (marker === EOI) {
      kept.push(Buffer.from([0xff, EOI]));

      return Buffer.concat(kept);
    }

    if (STANDALONE_MARKERS.has(marker)) {
      kept.push(Buffer.from([0xff, marker]));
      continue;
    }

    if (at + 2 > bytes.length) {
      return null;
    }

    const length = bytes.readUInt16BE(at);

    if (length < 2 || at + length > bytes.length) {
      return null;
    }

    const data = bytes.subarray(at + 2, at + length);
    at += length;

    const segment = keptSegment(marker, data);

    if (segment !== null) {
      kept.push(segment);
    }

    if (marker === SOS) {
      const scanEnd = endOfScan(bytes, at);
      kept.push(bytes.subarray(at, scanEnd));
      at = scanEnd;
    }
  }

  // No end of image.
  return null;
}

/**
 * Decide what of a JPEG segment stays.
 * @param marker the segment's marker
 * @param data the segment's data, after its length
 * @returns the segment to keep, possibly rewritten, or null to drop it
 */
function keptSegment(marker: number, data: Buffer): Buffer | null {
  // JFIF: its header without the thumbnail it may carry, which can show the photo before it was cropped.
  if (marker === 0xe0) {
    return startsWith(data, 'JFIF\0') && data.length >= 14
      ? jpegSegment(marker, Buffer.concat([data.subarray(0, 12), Buffer.from([0, 0])]))
      : null;
  }

  if (marker === 0xe1) {
    const orientation = startsWith(data, 'Exif\0\0') ? exifOrientation(data.subarray(6)) : null;

    return orientation === null ? null : orientationExif(orientation);
  }

  if (marker === 0xe2) {
    return startsWith(data, 'ICC_PROFILE\0') ? jpegSegment(marker, data) : null;
  }

  if (marker === 0xee) {
    return startsWith(data, 'Adobe') ? jpegSegment(marker, data) : null;
  }

  // Other application segments, comments and the reserved JPGn extensions.
  if ((marker >= 0xe0 && marker <= 0xef) || marker === COM || (marker >= 0xf0 && marker <= 0xfd)) {
    return null;
  }

  // Frames, tables, restart interval, scan header: the picture itself.
  return jpegSegment(marker, data);
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
    const next = bytes[at + 1];

    if (bytes[at] === 0xff && next !== undefined && next !== 0x00 && !(next >= 0xd0 && next <= 0xd7)) {
      return at;
    }

    at += bytes[at] === 0xff ? 2 : 1;
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

// What draws a PNG, its colours and its animation; text, Exif, time stamps and private chunks go.
const PNG_KEPT_CHUNKS = new Set([
  'IHDR',
  'PLTE',
  'IDAT',
  'IEND',
  'tRNS',
  'cHRM',
  'gAMA',
  'iCCP',
  'sBIT',
  'sRGB',
  'cICP',
  'mDCV',
  'cLLI',
  'bKGD',
  'pHYs',
  'acTL',
  'fcTL',
  'fdAT',
]);

/**
 * Keep of a PNG the chunks that draw it, from its header to its end, and nothing after.
 * @param bytes the PNG
 */
function pngWithoutMetadata(bytes: Buffer): Buffer | null {
  if (!bytes.subarray(0, 8).equals(PNG_SIGNATURE)) {
    return null;
  }

  const kept: Buffer[] = [PNG_SIGNATURE];
  let at = 8;

  while (at + 8 <= bytes.length) {
    const end = at + 12 + bytes.readUInt32BE(at);
    const type = bytes.toString('latin1', at + 4, at + 8);

    if (end > bytes.length || (at === 8 && type !== 'IHDR')) {
      return null;
    }

    if (PNG_KEPT_CHUNKS.has(type)) {
      kept.push(bytes.subarray(at, end));
    }

    if (type === 'IEND') {
      return Buffer.concat(kept);
    }

    at = end;
  }

  // No end of image.
  return null;
}

// What draws a WebP, its alpha, animation and colour profile; Exif, XMP and unknown chunks go.
const WEBP_KEPT_CHUNKS = new Set(['VP8 ', 'VP8L', 'VP8X', 'ALPH', 'ANIM', 'ANMF', 'ICCP']);
// The extended header's flags announcing Exif (0x08) and XMP (0x04) chunks.
const VP8X_METADATA_FLAGS = 0x0c;

/**
 * Keep of a WebP the chunks that draw it, within the length its header gives, and stop announcing the
 * metadata it no longer holds.
 * @param bytes the WebP
 */
function webpWithoutMetadata(bytes: Buffer): Buffer | null {
  if (bytes.length < 12 || !startsWith(bytes, 'RIFF') || bytes.toString('latin1', 8, 12) !== 'WEBP') {
    return null;
  }

  const end = 8 + bytes.readUInt32LE(4);

  if (end > bytes.length) {
    return null;
  }

  const kept: Buffer[] = [];
  let at = 12;

  while (at < end) {
    if (at + 8 > end) {
      return null;
    }

    const fourcc = bytes.toString('latin1', at, at + 4);
    const size = bytes.readUInt32LE(at + 4);
    const chunkEnd = at + 8 + size + (size % 2);

    if (chunkEnd > end) {
      return null;
    }

    if (WEBP_KEPT_CHUNKS.has(fourcc)) {
      const chunk = Buffer.from(bytes.subarray(at, chunkEnd));

      if (fourcc === 'VP8X' && size > 0) {
        chunk.writeUInt8(chunk.readUInt8(8) & ~VP8X_METADATA_FLAGS, 8);
      }

      kept.push(chunk);
    }

    at = chunkEnd;
  }

  if (!kept.some((chunk) => ['VP8 ', 'VP8L', 'ANMF'].includes(chunk.toString('latin1', 0, 4)))) {
    return null;
  }

  const body = Buffer.concat([Buffer.from('WEBP', 'latin1'), ...kept]);
  const head = Buffer.from('RIFF\0\0\0\0', 'latin1');
  head.writeUInt32LE(body.length, 4);

  return Buffer.concat([head, body]);
}

/**
 * Tell whether bytes begin with a Latin-1 text.
 * @param bytes the bytes
 * @param text the text
 */
function startsWith(bytes: Buffer, text: string): boolean {
  return bytes.subarray(0, text.length).equals(Buffer.from(text, 'latin1'));
}
