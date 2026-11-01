import { AsyncLocalStorage } from 'node:async_hooks';
import { Injectable } from '@nestjs/common';
import { sql } from 'drizzle-orm';

import { ORGANISATION_SETTING } from '../../db/helpers/organisation.ts';
import { Database, type Transaction } from './database.port.ts';

interface Scope {
  readonly db: Transaction;
  // null in a platform unit of work, which sees no Organisation's rows.
  readonly organisationId: string | null;
  readonly afterCommit: (() => Promise<void>)[];
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
    return this.open(organisationId, work);
  }

  /**
   * Run work in one transaction without an Organisation, for platform tables such as the Organisations
   * themselves; every Organisation-owned table looks empty and rejects writes.
   * @param work reads and writes through `db`
   */
  public runForPlatform<T>(work: () => Promise<T>): Promise<T> {
    return this.open(null, work);
  }

  /**
   * The current unit of work's transaction.
   * @throws {Error} outside a unit of work
   */
  public get db(): Transaction {
    return this.current().db;
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
   * Open the transaction, set the Organisation if there is one, and run work with it as the current scope.
   * @param organisationId the Organisation, or null for a platform unit of work
   * @param work runs inside the transaction
   * @throws {Error} when a unit of work is already open: they do not nest
   */
  private async open<T>(organisationId: string | null, work: () => Promise<T>): Promise<T> {
    if (this.scope.getStore() !== undefined) {
      throw new Error('A unit of work is already open; units of work do not nest');
    }

    const afterCommit: (() => Promise<void>)[] = [];
    const result = await this.database.drizzle.transaction(async (db) => {
      if (organisationId !== null) {
        // set_config, unlike SET LOCAL, takes the id as a bound parameter.
        await db.execute(sql`select set_config(${ORGANISATION_SETTING}, ${organisationId}, true)`);
      }

      return this.scope.run({ db, organisationId, afterCommit }, work);
    });

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
