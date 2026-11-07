import { describe, expect, it } from 'vitest';

import { addressSubject } from './address-subject.ts';

describe('addressSubject', () => {
  it('keeps an IPv4 address as it is', () => {
    expect(addressSubject('198.51.100.7')).toBe('198.51.100.7');
  });

  it('reads an IPv4-mapped IPv6 address as its IPv4 address', () => {
    expect(addressSubject('::ffff:198.51.100.7')).toBe('198.51.100.7');
    expect(addressSubject('::FFFF:198.51.100.7')).toBe('198.51.100.7');
    expect(addressSubject('::ffff:c633:6407')).toBe('198.51.100.7');
    expect(addressSubject('0:0:0:0:0:ffff:c633:6407')).toBe('198.51.100.7');
  });

  it('counts every IPv6 address of one /64 network as one, however it is written', () => {
    const subject = addressSubject('2001:db8:85a3:12::1');

    expect(subject).toBe('2001:db8:85a3:12::/64');
    expect(addressSubject('2001:0db8:85a3:0012:ffff:ffff:ffff:fffe')).toBe(subject);
    expect(addressSubject('2001:DB8:85A3:12:0:0:0:abcd')).toBe(subject);
  });

  it('tells IPv6 networks apart by their first 64 bits', () => {
    expect(addressSubject('2001:db8:85a3:13::1')).not.toBe(addressSubject('2001:db8:85a3:12::1'));
    expect(addressSubject('::1')).toBe('0:0:0:0::/64');
    expect(addressSubject('2001:db8::')).toBe('2001:db8:0:0::/64');
  });

  it('reads an IPv6 address with an embedded IPv4 tail and a zone', () => {
    expect(addressSubject('64:ff9b::198.51.100.7')).toBe('64:ff9b:0:0::/64');
    expect(addressSubject('fe80::1%eth0')).toBe('fe80:0:0:0::/64');
  });

  it('leaves anything else as it came, so it is still counted', () => {
    expect(addressSubject('not an address')).toBe('not an address');
  });
});
