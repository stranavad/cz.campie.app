import type { InferInsertModel, InferSelectModel } from 'drizzle-orm';

import type { PublicTurnus, Turnus, TurnusAvailability } from '@repo/schema/camps';
import { priceInForce } from '@repo/schema/pricing';
import { pragueLocalOf } from '@repo/schema/shared';

import type { turnusy } from '../../../db/schema.ts';

export type TurnusSelectModel = InferSelectModel<typeof turnusy>;
export type TurnusInsertModel = InferInsertModel<typeof turnusy>;

export class TurnusEntity {
  public readonly id: string;
  public readonly campId: string;
  public readonly name: string;
  public readonly startDate: string;
  public readonly endDate: string;
  public readonly place: string;
  public readonly capacity: number;
  public readonly minAge: number | null;
  public readonly maxAge: number | null;
  public readonly opensAt: Date | null;
  public readonly closesAt: Date | null;
  public readonly closedManually: boolean;
  public readonly websiteUrl: string | null;
  public readonly basePrice: number;
  public readonly earlyBirdPrice: number | null;
  public readonly earlyBirdLastDay: string | null;
  public readonly deposit: number | null;
  public readonly depositDueDays: number;
  public readonly balanceDueDate: string | null;

  constructor(row: TurnusSelectModel) {
    this.id = row.id;
    this.campId = row.campId;
    this.name = row.name;
    this.startDate = row.startDate;
    this.endDate = row.endDate;
    this.place = row.place;
    this.capacity = row.capacity;
    this.minAge = row.minAge;
    this.maxAge = row.maxAge;
    this.opensAt = row.opensAt;
    this.closesAt = row.closesAt;
    this.closedManually = row.closedManually;
    this.websiteUrl = row.websiteUrl;
    this.basePrice = row.basePrice;
    this.earlyBirdPrice = row.earlyBirdPrice;
    this.earlyBirdLastDay = row.earlyBirdLastDay;
    this.deposit = row.deposit;
    this.depositDueDays = row.depositDueDays;
    this.balanceDueDate = row.balanceDueDate;
  }

  toDto(registered: number, availability: TurnusAvailability): Turnus {
    return {
      id: this.id,
      campId: this.campId,
      name: this.name,
      startDate: this.startDate,
      endDate: this.endDate,
      place: this.place,
      capacity: this.capacity,
      minAge: this.minAge,
      maxAge: this.maxAge,
      // The window as admins enter it, on the Prague clock.
      opensAt: this.opensAt === null ? null : pragueLocalOf(this.opensAt),
      closesAt: this.closesAt === null ? null : pragueLocalOf(this.closesAt),
      closedManually: this.closedManually,
      websiteUrl: this.websiteUrl,
      basePrice: this.basePrice,
      earlyBirdPrice: this.earlyBirdPrice,
      earlyBirdLastDay: this.earlyBirdLastDay,
      deposit: this.deposit,
      depositDueDays: this.depositDueDays,
      balanceDueDate: this.balanceDueDate,
      availability,
      registered,
    };
  }

  // Shows only the places left, never the capacity or the Registrations, and the price in force on the
  // Prague date of `now`.
  toPublicDto(registered: number, availability: TurnusAvailability, now: Date): PublicTurnus {
    return {
      id: this.id,
      name: this.name,
      startDate: this.startDate,
      endDate: this.endDate,
      place: this.place,
      minAge: this.minAge,
      maxAge: this.maxAge,
      websiteUrl: this.websiteUrl,
      basePrice: this.basePrice,
      earlyBirdPrice: this.earlyBirdPrice,
      earlyBirdLastDay: this.earlyBirdLastDay,
      priceNow: priceInForce(this, now).amount,
      deposit: this.deposit,
      opensAt: this.opensAt === null ? null : this.opensAt.toISOString(),
      closesAt: this.closesAt === null ? null : this.closesAt.toISOString(),
      availability,
      remainingPlaces: Math.max(0, this.capacity - registered),
    };
  }
}
