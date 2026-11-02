import { describe, expect, it } from 'vitest';

import { passwordProblem } from './password.ts';

const context = { email: 'jana.testovaci@example.com', productName: 'Campie' };

describe('passwordProblem', () => {
  it.each(['spravne kun baterie sponka', 'Tábor u rybníka 2027!', 'k8#Lq2vZ!m0x', 'heslo-na-tabor-42'])(
    'accepts %j',
    (password) => {
      expect(passwordProblem(password, context)).toBeNull();
    },
  );

  it('refuses fewer than 12 characters, and more than 200', () => {
    expect(passwordProblem('k8#Lq2vZ!m0', context)).toBe('password_too_short');
    expect(passwordProblem(`k8#Lq2vZ!m0x${'a'.repeat(189)}`, context)).toBe('password_too_long');
  });

  it.each(['aaaaaaaaaaaa', '121212121212', 'abcabcabcabcabc', 'ab12ab12ab12ab12'])(
    'calls %j too simple: fewer than 6 different characters',
    (password) => {
      expect(passwordProblem(password, context)).toBe('password_too_simple');
    },
  );

  it.each(['123456789012', '098765432109', 'abcdefghijklmn', 'qwertyuiopas', 'QWERTZUIOPASDF', 'asdfghjkl123'])(
    'calls %j too simple: a run along the keyboard, the alphabet or the digits',
    (password) => {
      expect(passwordProblem(password, context)).toBe('password_too_simple');
    },
  );

  it('refuses the email, a part of it, or the product name inside the password', () => {
    expect(passwordProblem('jana.testovaci-heslo', context)).toBe('password_guessable');
    expect(passwordProblem('Testovaci+2027!', context)).toBe('password_guessable');
    expect(passwordProblem('moje-CAMPIE-heslo', context)).toBe('password_guessable');
  });

  it('ignores parts of the email too short to matter', () => {
    expect(passwordProblem('jan-na-tabore-2027', { email: 'jan.ek@example.com', productName: 'Campie' })).toBeNull();
  });

  it('checks without an email when none is known', () => {
    expect(passwordProblem('jana.testovaci-heslo', { productName: 'Campie' })).toBeNull();
  });
});
