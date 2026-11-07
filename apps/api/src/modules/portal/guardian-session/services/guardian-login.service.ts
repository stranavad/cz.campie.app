import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { GuardianLoginErrorCode, RequestLoginLinkBody, StartGuardianSessionBody } from '@repo/schema/portal';

import { AuditService } from '../../../../core/audit/audit.service.ts';
import type { Env } from '../../../../core/config/env.schema.ts';
import { UnitOfWork } from '../../../../core/database/unit-of-work.ts';
import { JobQueue } from '../../../../core/jobs/job-queue.ts';
import { Clock } from '../../../../core/ports/clock/clock.port.ts';
import { RateLimiter, type RequestLimit } from '../../../../core/rate-limits/rate-limiter.ts';
import { generateSessionToken, hashSessionToken, type IssuedSession } from '../../../../core/sessions/session-token.ts';
import { SessionService } from '../../../../core/sessions/session.service.ts';
import { TurnusRepository } from '../../../../repositories/camps/turnus/turnus.repository.ts';
import { OrganisationRepository } from '../../../../repositories/organisations/organisation/organisation.repository.ts';
import { RegistrationRepository } from '../../../../repositories/registrations/registration/registration.repository.ts';
import { GuardianLoginLinkRepository } from '../../../../repositories/sessions/guardian-login-link/guardian-login-link.repository.ts';
import { CampEmailService } from '../../../camps/camp-email/services/camp-email.service.ts';
import { loginLinkRequestedJob } from '../login-link-requested.job.ts';

// Long enough to open the mail, short enough that an old mailbox holds no working link.
const LOGIN_LINK_VALID_MS = 30 * 60 * 1000;

// Guardians sign in to the portal of an Organisation's subdomain by an emailed, single-use link.
@Injectable()
export class GuardianLoginService {
  private readonly limit: RequestLimit;
  private readonly scheme: string;
  private readonly domain: string;

  constructor(
    private readonly registrations: RegistrationRepository,
    private readonly loginLinks: GuardianLoginLinkRepository,
    private readonly turnusy: TurnusRepository,
    private readonly organisations: OrganisationRepository,
    private readonly campEmails: CampEmailService,
    private readonly sessions: SessionService,
    private readonly rateLimiter: RateLimiter,
    private readonly jobs: JobQueue,
    private readonly audit: AuditService,
    private readonly unitOfWork: UnitOfWork,
    private readonly clock: Clock,
    config: ConfigService<Env, true>,
  ) {
    this.limit = config.get('requestLimits', { infer: true }).loginLink;
    this.scheme = config.get('PLATFORM_SCHEME', { infer: true });
    this.domain = config.get('PLATFORM_DOMAIN', { infer: true });
  }

  /**
   * Record a request for a login link and leave the lookup to its job, so a known and an unknown email take
   * the same path and the same time, and the caller cannot tell them apart. Counts against the login link
   * limit of the address and of the email in this Organisation, so a flood on one Organisation's subdomain
   * never locks a guardian out of another's.
   * @param body the email
   * @param ipAddress where the request comes from
   */
  public async request({ email }: RequestLoginLinkBody, ipAddress: string): Promise<void> {
    await this.rateLimiter.admit(this.limit, { ipAddress, target: `${this.unitOfWork.organisationId}:${email}` });

    this.jobs.enqueue(loginLinkRequestedJob, { requestId: await this.loginLinks.createRequest(email) });
  }

  /**
   * Send a login link to a guardian just added to a Registration, as their invitation, without the request
   * limit a guardian's own request counts against.
   * @param email the new guardian's email
   */
  public async invite(email: string): Promise<void> {
    this.jobs.enqueue(loginLinkRequestedJob, { requestId: await this.loginLinks.createRequest(email) });
  }

  /**
   * Take a request for a login link and, when its email is a guardian of the current Organisation's
   * Registrations, make a link and email it from the Camp of their latest one. Only the token's hash is
   * stored; the token goes into the link.
   * @param requestId the request
   */
  public async sendLink(requestId: string): Promise<void> {
    const email = await this.loginLinks.takeRequest(requestId);
    const [latest] = email === null ? [] : await this.registrations.listByGuardian(email);

    if (email === null || latest === undefined) {
      return;
    }

    const token = generateSessionToken();
    const organisation = await this.organisations.getByIdOrThrow(this.unitOfWork.organisationId);
    const turnus = await this.turnusy.getByIdOrThrow(latest.turnusId);

    await this.loginLinks.create({
      email,
      tokenHash: hashSessionToken(token),
      expiresAt: new Date(this.clock.now().getTime() + LOGIN_LINK_VALID_MS),
    });
    await this.campEmails.send(turnus.campId, 'login_link', {
      values: {},
      to: [email],
      actionHref: `${this.scheme}://${organisation.subdomain}.${this.domain}/portal/prihlaseni?token=${token}`,
    });
  }

  /**
   * Use a login link, once, and start a session of its guardian in the current Organisation, audited. The
   * guardian's other links stop working with it.
   * @param body the token from the link
   * @param ipAddress where the request comes from
   * @throws {BadRequestException} login_link_invalid when the link is unknown, used or expired
   */
  public async startSession({ token }: StartGuardianSessionBody, ipAddress: string): Promise<IssuedSession> {
    const link = await this.loginLinks.consume(hashSessionToken(token), this.clock.now());

    if (link === null) {
      const code: GuardianLoginErrorCode = 'login_link_invalid';

      throw new BadRequestException({ code, message: 'The login link is unknown, used or expired' });
    }

    await this.loginLinks.consumeAllOf(link.email, this.clock.now());
    const session = await this.sessions.startGuardian(link.email);

    await this.audit.record(
      { kind: 'guardian', identity: link.email, ipAddress },
      { action: 'guardian_login_link.use', target: { type: 'guardian_login_link', id: link.id } },
    );

    return session;
  }

  /**
   * End the guardian session a token opens.
   * @param token the token from the cookie
   */
  public async endSession(token: string): Promise<void> {
    await this.sessions.endGuardian(token);
  }
}
