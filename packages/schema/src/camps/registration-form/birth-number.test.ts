import { describe, expect, it } from 'vitest';

import { parseBirthNumber } from './birth-number.ts';

// Made-up numbers that pass the checksum; none is anyone's.
describe('parseBirthNumber', () => {
  it('reads the birth date and gender, with or without the slash, and writes it with one', () => {
    expect(parseBirthNumber('160504/0019')).toEqual({
      formatted: '160504/0019',
      birthDate: '2016-05-04',
      gender: 'male',
    });
    expect(parseBirthNumber(' 1605040019 ')).toMatchObject({ formatted: '160504/0019' });
  });

  it('reads a woman by 50 added to the month, and from 2004 either with 20 more', () => {
    expect(parseBirthNumber('165504/0024')).toMatchObject({ birthDate: '2016-05-04', gender: 'female' });
    expect(parseBirthNumber('162504/0032')).toMatchObject({ birthDate: '2016-05-04', gender: 'male' });
    expect(parseBirthNumber('167504/0048')).toMatchObject({ birthDate: '2016-05-04', gender: 'female' });
  });

  it('takes the 20 added to the month only from 2004', () => {
    expect(parseBirthNumber('992101/0000')).toBeNull();
  });

  it('refuses a wrong check digit, and takes 0 for a remainder of 10 only before 1986', () => {
    expect(parseBirthNumber('160504/0018')).toBeNull();
    expect(parseBirthNumber('800101/0040')).toMatchObject({ birthDate: '1980-01-01' });
    expect(parseBirthNumber('100101/0000')).toBeNull();
  });

  it('refuses a day the month does not have, a month out of range, and anything but ten digits', () => {
    expect(parseBirthNumber('160231/0017')).toBeNull();
    expect(parseBirthNumber('161304/0011')).toBeNull();
    expect(parseBirthNumber('540101/001')).toBeNull();
    expect(parseBirthNumber('16O504/0019')).toBeNull();
  });
});
