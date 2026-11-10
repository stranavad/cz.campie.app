import { describe, expect, it } from 'vitest';

import { buildHeaders, buildRobots } from '../src/lib/headers.ts';

// The headers for every path: the block under "/*".
const allPaths = (headers: string) => headers.split('\n/')[0] ?? '';

describe('indexing per deployment', () => {
  it('lets production be indexed', () => {
    expect(allPaths(buildHeaders('production'))).not.toContain('X-Robots-Tag');
    expect(buildRobots('production')).toBe('User-agent: *\nAllow: /\n\nSitemap: https://campie.cz/sitemap-index.xml\n');
  });

  it('keeps the preview and local builds out of search engines', () => {
    for (const env of ['dev', 'local'] as const) {
      expect(allPaths(buildHeaders(env))).toContain('X-Robots-Tag: noindex, nofollow');
      expect(buildRobots(env)).toBe('User-agent: *\nDisallow: /\n');
    }
  });
});
