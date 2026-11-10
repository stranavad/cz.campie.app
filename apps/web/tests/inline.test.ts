import { describe, expect, it } from 'vitest';

import { toHtml, toPlain } from '../src/lib/inline.ts';

describe('inline markup', () => {
  it('escapes raw HTML and renders bold, code and links', () => {
    expect(toHtml('<script>x</script> **tučně** `kod` [Bezpečnost](/bezpecnost) & "uvozovky"')).toBe(
      '&lt;script&gt;x&lt;/script&gt; <strong>tučně</strong> <code>kod</code> <a href="/bezpecnost">Bezpečnost</a> &amp; &quot;uvozovky&quot;',
    );
  });

  it('points platform links at the app of the build', () => {
    expect(toHtml('[Zpracování dat](app:/zpracovani-dat)')).toBe(
      '<a href="https://app.staging.campie.cz/zpracovani-dat">Zpracování dat</a>',
    );
  });

  it('keeps only the words for plain text', () => {
    expect(toPlain('Na **vastabor** `campie.cz`, viz [Bezpečnost](/bezpecnost).')).toBe(
      'Na vastabor campie.cz, viz Bezpečnost.',
    );
  });
});
