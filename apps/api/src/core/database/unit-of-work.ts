import { AsyncLocalStorage } from 'node:async_hooks';
import { Injectable } from '@nestjs/common';
import { sql } from 'drizzle-orm';

import { ORGANISATION_SETTING } from '../../db/helpers/organisation.ts';
import { Database, type Transaction } from './database.port.ts';

interface Scope {
  readonly db: Transaction;
  // null in a platform unit of work, which sees no Organisation's rows, until it enters one.
  organisationId: string | null;
  // false for the operator console's, which must never reach an Organisation's own data.
  readonly mayEnter: boolean;
  readonly afterCommit: (() => Promise<void>)[];
  readonly afterRollback: (() => Promise<void>)[];
  // Items gathered for one after-commit step each, by the key that gathers them.
  readonly gathered: Map<object, unknown[]>;
}

// The only way to Organisation data. Each unit of work is one transaction on one connection; the current
// Organisation is set inside it, so row-level security admits only that Organisation's rows, and the
// setting ends with the transaction.
@Injectable()
export class UnitOfWork {
  private readonly scope = new AsyncLocalStorage<Scope>();

  constructor(private readonly database: Database) {}

  /**
   * Run work in one transaction for one Organisation: committed when work resolves, rolled back when it throws.
   * @param organisationId the current Organisation, resolved by infrastructure, never from client input
   * @param work reads and writes through `db`
   */
  public run<T>(organisationId: string, work: () => Promise<T>): Promise<T> {
    return this.open(organisationId, work, false);
  }

  /**
   * Run work in one transaction without an Organisation, for platform tables such as the Organisations
   * themselves; every Organisation-owned table looks empty and rejects writes.
   * @param work reads and writes through `db`
   */
  public runForPlatform<T>(work: () => Promise<T>): Promise<T> {
    return this.open(null, work, true);
  }

  /**
   * Run work in one transaction without an Organisation that can never enter one, for the operator
   * console: it reaches platform tables only, and every Organisation-owned table stays empty to it.
   * @param work reads and writes through `db`
   */
  public runForOperator<T>(work: () => Promise<T>): Promise<T> {
    return this.open(null, work, false);
  }

  /**
   * Make the current platform unit of work the given Organisation's for the rest of its transaction, so
   * the records of an Organisation it has just created commit together with it.
   * @param organisationId the Organisation, never from client input
   * @throws {Error} outside a platform unit of work, and in the operator console's
   */
  public async enter(organisationId: string): Promise<void> {
    const scope = this.current();

    if (scope.organisationId !== null) {
      throw new Error('Only a platform unit of work can enter an Organisation');
    }

    if (!scope.mayEnter) {
      throw new Error("The operator console's unit of work never enters an Organisation");
    }

    await scope.db.execute(sql`select set_config(${ORGANISATION_SETTING}, ${organisationId}, true)`);
    scope.organisationId = organisationId;
  }

  /**
   * The current unit of work's transaction.
   * @throws {Error} outside a unit of work
   */
  public get db(): Transaction {
    return this.current().db;
  }

  /**
   * Whether the current unit of work is an Organisation's, entered or from the start.
   * @throws {Error} outside a unit of work
   */
  public get inOrganisation(): boolean {
    return this.current().organisationId !== null;
  }

  /**
   * The current unit of work's Organisation, for inserts.
   * @throws {Error} outside a unit of work, or in a platform one
   */
  public get organisationId(): string {
    const { organisationId } = this.current();

    if (organisationId === null) {
      throw new Error('A platform unit of work has no Organisation');
    }

    return organisationId;
  }

  /**
   * Run work after the current unit of work commits; never when it rolls back.
   * @param work runs outside any unit of work, before the unit of work resolves; its change is committed
   * by then, so work that throws rejects a unit of work whose change stands
   */
  public afterCommit(work: () => Promise<void>): void {
    this.current().afterCommit.push(work);
  }

  /**
   * Gather an item for one after-commit step that receives all items gathered under the same key in the
   * current unit of work, such as jobs sent to the queue in one round trip.
   * @param key what gathers the items, the same object on every call
   * @param item the item
   * @param flush runs once after the commit with every item, in the order they were gathered
   */
  public gatherAfterCommit<T>(key: object, item: T, flush: (items: T[]) => Promise<void>): void {
    const scope = this.current();
    const items = scope.gathered.get(key);

    if (items !== undefined) {
      items.push(item);

      return;
    }

    const first: T[] = [item];

    scope.gathered.set(key, first);
    scope.afterCommit.push(() => flush(first));
  }

  /**
   * Run work after the current unit of work rolls back, to undo an effect outside the database; never when
   * it commits.
   * @param work runs outside any unit of work, before the rollback's error reaches the caller; it must not
   * throw, or its error replaces that one
   */
  public afterRollback(work: () => Promise<void>): void {
    this.current().afterRollback.push(work);
  }

  /**
   * Open the transaction, set the Organisation if there is one, and run work with it as the current scope.
   * @param organisationId the Organisation, or null for a platform unit of work
   * @param work runs inside the transaction
   * @param mayEnter whether a platform unit of work may enter an Organisation
   * @throws {Error} when a unit of work is already open: they do not nest
   */
  private async open<T>(organisationId: string | null, work: () => Promise<T>, mayEnter: boolean): Promise<T> {
    if (this.scope.getStore() !== undefined) {
      throw new Error('A unit of work is already open; units of work do not nest');
    }

    const afterCommit: (() => Promise<void>)[] = [];
    const afterRollback: (() => Promise<void>)[] = [];
    const gathered = new Map<object, unknown[]>();
    let result: T;

    try {
      result = await this.database.drizzle.transaction(async (db) => {
        if (organisationId !== null) {
          // set_config, unlike SET LOCAL, takes the id as a bound parameter.
          await db.execute(sql`select set_config(${ORGANISATION_SETTING}, ${organisationId}, true)`);
        }

        return this.scope.run({ db, organisationId, mayEnter, afterCommit, afterRollback, gathered }, work);
      });
    } catch (error) {
      for (const callback of afterRollback) {
        await callback();
      }

      throw error;
    }

    for (const callback of afterCommit) {
      await callback();
    }

    return result;
  }

  /**
   * The open unit of work.
   * @throws {Error} outside a unit of work
   */
  private current(): Scope {
    const scope = this.scope.getStore();

    if (scope === undefined) {
      throw new Error('No unit of work is open; the database is reachable only inside one');
    }

    return scope;
  }
}
