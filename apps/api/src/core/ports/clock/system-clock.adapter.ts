import { Clock } from './clock.port.ts';

export class SystemClock extends Clock {
  public now(): Date {
    return new Date();
  }
}
