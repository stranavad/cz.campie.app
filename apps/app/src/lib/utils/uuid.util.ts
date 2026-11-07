/**
 * Make a UUIDv7, as every identifier of the platform is: a millisecond timestamp, then random bits.
 */
export function uuidv7(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  const time = Date.now();

  for (let index = 0; index < 6; index += 1) {
    bytes[index] = Math.floor(time / 2 ** (8 * (5 - index))) & 0xff;
  }

  bytes[6] = ((bytes[6] ?? 0) & 0x0f) | 0x70;
  bytes[8] = ((bytes[8] ?? 0) & 0x3f) | 0x80;
  const hex = [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('');

  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
