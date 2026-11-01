import { Clock } from './clock.port.ts';

// Frozen at the moment it was created until a test sets or advances it.
export class ControllableClock extends Clock {
  private current = Date.now();

  public now(): Date {
    return new Date(this.current);
  }

  public set(instant: Date): void {
    this.current = instant.getTime();
  }

  public advance(milliseconds: number): void {
    this.current += milliseconds;
  }
}
