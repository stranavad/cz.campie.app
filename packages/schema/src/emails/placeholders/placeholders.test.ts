import { describe, expect, it } from 'vitest';

import { fillPlaceholders, unknownPlaceholders } from './placeholders.ts';

describe('placeholders', () => {
  it('fills every known placeholder, however it is spaced, and leaves the rest of the text as written', () => {
    const text = 'Dobrý den,\nVariabilní symbol: {{variabilni_symbol}}, částka {{ castka }} Kč. {{variabilni_symbol}}';

    expect(fillPlaceholders(text, { variabilni_symbol: '26123456', castka: '4 500' })).toBe(
      'Dobrý den,\nVariabilní symbol: 26123456, částka 4 500 Kč. 26123456',
    );
  });

  it('inserts values literally, so a value that looks like a placeholder is not filled again', () => {
    expect(fillPlaceholders('Tábor: {{tabor}}', { tabor: '{{castka}}', castka: '4 500' })).toBe('Tábor: {{castka}}');
  });

  it('names each unknown or malformed placeholder once, in the order written, for rejecting a text on save', () => {
    const text = 'Platba {{castka}} do {{ splatnost }}, {{Castka}}, {{neznamy}}, {{}}, {{neznamy}}, {jednoducha}';

    expect(unknownPlaceholders(text, ['castka', 'splatnost'])).toEqual(['Castka', 'neznamy', '']);
  });

  it('names a stray double brace, so a placeholder missing one of its braces is not taken for text', () => {
    expect(unknownPlaceholders('Částka {{castka} Kč, splatnost {splatnost}}.', ['castka', 'splatnost'])).toEqual([
      '{{',
      '}}',
    ]);
  });

  it('finds nothing unknown in a text that only uses known placeholders or none', () => {
    expect(unknownPlaceholders('Dobrý den, {{ castka }}.', ['castka'])).toEqual([]);
    expect(unknownPlaceholders('Dobrý den.', [])).toEqual([]);
  });
});
