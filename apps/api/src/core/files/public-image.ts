// Headers of an image served to everyone without a link (a logo, a Camp's photo). Its address carries the
// file id, and a new image gets a new one, so browsers and proxies may keep it for good. Opened on its own,
// it is only ever the image its type says: no sniffing it into a page, and it may run nothing and load nothing.
export const PUBLIC_IMAGE_HEADERS = {
  'Cache-Control': 'public, max-age=31536000, immutable',
  'X-Content-Type-Options': 'nosniff',
  'Content-Security-Policy': "default-src 'none'; sandbox",
} as const;
