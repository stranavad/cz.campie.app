import { Injectable } from '@nestjs/common';

import type { OrganisationStatus } from '@repo/schema/organisations';

import { UnitOfWork } from '../database/unit-of-work.ts';
import { Clock } from '../ports/clock/clock.port.ts';

// How long an Organisation found by its subdomain is served from memory. Another API instance that
// suspends it is noticed within this time at the latest; this instance's own console changes clear it.
export const ORGANISATION_HOST_TTL_MS = 5000;
// Enough for every Organisation busy at once; beyond it the oldest entry goes.
const MAX_ENTRIES = 1000;

// What a public or guardian request needs of the Organisation its subdomain names.
export interface HostOrganisation {
  readonly id: string;
  readonly status: OrganisationStatus;
}

// Keeps the Organisations of recently seen subdomains for a few seconds, so a public page or the portal
// does not open a transaction per request only to find its Organisation. A subdomain no Organisation has
// is never kept: an Organisation approved a moment later is reachable at once.
@Injectable()
export class OrganisationHostCache {
  private readonly entries = new Map<string, { organisation: HostOrganisation; expiresAt: number }>();
  // Counts the changes forgotten, so a load that overlapped one is not kept.
  private generation = 0;

  constructor(
    private readonly clock: Clock,
    private readonly unitOfWork: UnitOfWork,
  ) {}

  /**
   * Get the Organisation of a subdomain from memory while it is fresh, else load and keep it.
   * @param subdomain the subdomain, lowercase
   * @param load reads the Organisation from the database, null when none has the subdomain
   */
  public async get(subdomain: string, load: () => Promise<HostOrganisation | null>): Promise<HostOrganisation | null> {
    const now = this.clock.now().getTime();
    const kept = this.entries.get(subdomain);

    if (kept !== undefined && kept.expiresAt > now) {
      return kept.organisation;
    }

    this.entries.delete(subdomain);

    const generation = this.generation;
    const organisation = await load();

    // A load that overlapped a change may have read the Organisation as it was: used once, never kept.
    if (organisation === null || generation !== this.generation) {
      return organisation;
    }

    if (this.entries.size >= MAX_ENTRIES) {
      const oldest = this.entries.keys().next();

      if (oldest.done !== true) {
        this.entries.delete(oldest.value);
      }
    }

    this.entries.set(subdomain, {
      organisation: { id: organisation.id, status: organisation.status },
      expiresAt: now + ORGANISATION_HOST_TTL_MS,
    });

    return organisation;
  }

  /**
   * Forget every kept Organisation once the current unit of work commits, after a change to an
   * Organisation's status or subdomain; a rollback keeps them, as nothing changed.
   */
  public forgetAfterCommit(): void {
    this.unitOfWork.afterCommit(() => {
      this.generation += 1;
      this.entries.clear();

      return Promise.resolve();
    });
  }
}
