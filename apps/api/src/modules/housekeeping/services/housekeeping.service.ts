import { Injectable, Logger } from '@nestjs/common';

import { JobQueue } from '../../../core/jobs/job-queue.ts';
import { Clock } from '../../../core/ports/clock/clock.port.ts';
import { EmailChangeRepository } from '../../../repositories/admins/email-change/email-change.repository.ts';
import { InvitationRepository } from '../../../repositories/admins/invitation/invitation.repository.ts';
import { PasswordResetRepository } from '../../../repositories/admins/password-reset/password-reset.repository.ts';
import { OrganisationRepository } from '../../../repositories/organisations/organisation/organisation.repository.ts';
import { GuardianEmailChangeRepository } from '../../../repositories/registrations/guardian-email-change/guardian-email-change.repository.ts';
import { AdminSessionRepository } from '../../../repositories/sessions/admin-session/admin-session.repository.ts';
import { GuardianLoginLinkRepository } from '../../../repositories/sessions/guardian-login-link/guardian-login-link.repository.ts';
import { GuardianSessionRepository } from '../../../repositories/sessions/guardian-session/guardian-session.repository.ts';
import { ParticipantExportService } from '../../registrations/participant-export/services/participant-export.service.ts';
import { organisationHousekeepingJob } from '../housekeeping.jobs.ts';

const DAY_MS = 24 * 60 * 60 * 1000;
// Login data stays a day past its expiry: no check reads it by then, and a job retrying with it has given
// up (the longest backoff ends within about an hour).
const LOGIN_DATA_KEPT_MS = DAY_MS;
// An expired invitation stays listed for its Owner to send again for a while before it goes.
const INVITATION_KEPT_MS = 30 * DAY_MS;

// Removes what expired and nobody needs any more: sessions, login links and requests, password resets,
// email changes and invitations past their expiry, and exports a day old, whose files hold personal data.
// Platform tables in the platform's unit of work; each Organisation's tables in its own.
@Injectable()
export class HousekeepingService {
  private readonly logger = new Logger(HousekeepingService.name);

  constructor(
    private readonly organisations: OrganisationRepository,
    private readonly adminSessions: AdminSessionRepository,
    private readonly passwordResets: PasswordResetRepository,
    private readonly adminEmailChanges: EmailChangeRepository,
    private readonly invitations: InvitationRepository,
    private readonly guardianSessions: GuardianSessionRepository,
    private readonly loginLinks: GuardianLoginLinkRepository,
    private readonly emailChanges: GuardianEmailChangeRepository,
    private readonly exports: ParticipantExportService,
    private readonly jobs: JobQueue,
    private readonly clock: Clock,
  ) {}

  /**
   * Remove the platform's expired admin sessions, password resets, email changes and invitations, and have every
   * Organisation tidy its own data once this commits.
   */
  public async tidyPlatform(): Promise<void> {
    const now = this.clock.now().getTime();
    const loginDataBefore = new Date(now - LOGIN_DATA_KEPT_MS);

    const removed = {
      adminSessions: await this.adminSessions.removeExpired(loginDataBefore),
      passwordResets: await this.passwordResets.removeExpired(loginDataBefore),
      emailChanges: await this.adminEmailChanges.removeExpired(loginDataBefore),
      invitations: await this.invitations.removeAllExpired(new Date(now - INVITATION_KEPT_MS)),
    };
    const organisations = await this.organisations.list();

    this.jobs.enqueueForEach(
      organisationHousekeepingJob,
      organisations.map(({ id }) => id),
      {},
    );
    this.logger.log(`Housekeeping removed ${JSON.stringify(removed)}; ${organisations.length} Organisations to tidy`);
  }

  /**
   * Remove the current Organisation's expired guardian sessions, login links, login requests and email
   * changes, and expire its exports a day old.
   */
  public async tidyOrganisation(): Promise<void> {
    const before = new Date(this.clock.now().getTime() - LOGIN_DATA_KEPT_MS);

    await this.guardianSessions.removeExpired(before);
    await this.loginLinks.removeExpired(before);
    await this.loginLinks.removeRequestsBefore(before);
    await this.emailChanges.removeExpired(before);
    await this.exports.expireOld();
  }
}
