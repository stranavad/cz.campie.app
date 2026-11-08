import { describe, expect, it } from 'vitest';

import { subdomainProblem } from './subdomain.ts';

describe('subdomainProblem', () => {
  it.each(['tabor-sokol', 'oddil42', 'a', 'x'.repeat(63)])('accepts %s', (subdomain) => {
    expect(subdomainProblem(subdomain, 'Campie')).toBeNull();
  });

  it.each(['', 'Tabor', '-tabor', 'tabor-', 'a--b', 'tábor', 'ta bor', 'tabor.cz', 'x'.repeat(64)])(
    'calls %j malformed',
    (subdomain) => {
      expect(subdomainProblem(subdomain, 'Campie')).toBe('subdomain_malformed');
    },
  );

  it.each([
    'www',
    'app',
    'api',
    'admin',
    'staging',
    'mail',
    'auth',
    'posta',
    'static',
    'cdn',
    'status',
    'help',
    'docs',
    'blog',
  ])('calls %s reserved', (subdomain) => {
    expect(subdomainProblem(subdomain, 'Campie')).toBe('subdomain_reserved');
  });

  it('reserves the configured product name, as it would be written in an address', () => {
    expect(subdomainProblem('campie', 'Campie')).toBe('subdomain_reserved');
    expect(subdomainProblem('tabory-online', 'Tábory Online')).toBe('subdomain_reserved');
    expect(subdomainProblem('campie', 'Tábory Online')).toBeNull();
  });
});
