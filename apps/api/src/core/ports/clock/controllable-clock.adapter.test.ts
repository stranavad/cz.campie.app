import { describe, expect, it } from 'vitest';

import { ControllableClock } from './controllable-clock.adapter.ts';

describe('ControllableClock', () => {
  it('stays frozen until moved', async () => {
    const clock = new ControllableClock();
    const first = clock.now();

    await new Promise((resolve) => setTimeout(resolve, 5));

    expect(clock.now()).toEqual(first);
  });

  it('can be set and advanced', () => {
    const clock = new ControllableClock();

    clock.set(new Date('2027-02-01T22:59:30.000Z'));
    clock.advance(45_000);

    expect(clock.now()).toEqual(new Date('2027-02-01T23:00:15.000Z'));
  });

  it('hands out copies, so a caller mutating a Date does not move the clock', () => {
    const clock = new ControllableClock();
    clock.set(new Date('2027-02-01T12:00:00.000Z'));

    clock.now().setFullYear(2030);

    expect(clock.now()).toEqual(new Date('2027-02-01T12:00:00.000Z'));
  });
});
