import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import {
  CURRENT_LEGAL_VERSIONS,
  LEGAL_DOCUMENTS,
  subdomainProblem,
  type SignUpErrorCode,
  type SignUpOrganisationBody,
  type SubdomainErrorCode,
} from '@repo/schema/organisations';
import { passwordProblem, type PasswordErrorCode } from '@repo/schema/shared';

import type { Actor } from '../../../../core/audit/actor.ts';
import { AuditService } from '../../../../core/audit/audit.service.ts';
import type { Env } from '../../../../core/config/env.schema.ts';
import { violatedConstraint } from '../../../../core/database/constraint-violation.ts';
import { UnitOfWork } from '../../../../core/database/unit-of-work.ts';
import { EncryptionService } from '../../../../core/encryption/encryption.service.ts';
import { JobQueue } from '../../../../core/jobs/job-queue.ts';
import { hashPassword } from '../../../../core/passwords/password-hash.ts';
import { Clock } from '../../../../core/ports/clock/clock.port.ts';
import { RateLimiter, type RequestLimit } from '../../../../core/rate-limits/rate-limiter.ts';
import type { IssuedSession } from '../../../../core/sessions/session-token.ts';
import { SessionService } from '../../../../core/sessions/session.service.ts';
import type { AdminEntity } from '../../../../repositories/admins/admin/admin.entity.ts';
import { LegalAcceptanceRepository } from '../../../../repositories/organisations/legal-acceptance/legal-acceptance.repository.ts';
import type { OrganisationEntity } from '../../../../repositories/organisations/organisation/organisation.entity.ts';
import {
  OrganisationRepository,
  type CreateOrganisation,
} from '../../../../repositories/organisations/organisation/organisation.repository.ts';
import { AdminService } from '../../../admins/admin/services/admin.service.ts';
import { EmailVerificationService } from '../../../admins/email-verification/services/email-verification.service.ts';
import { MembershipService } from '../../../admins/membership/services/membership.service.ts';
import { CampService } from '../../../camps/camp/services/camp.service.ts';
import { organisationSignedUpJob } from '../organisation-signed-up.job.ts';

// The unique constraints a simultaneous signup can lose on, and the code the loser gets.
const TAKEN_BY_CONSTRAINT: Readonly<Record<string, SignUpErrorCode | SubdomainErrorCode>> = {
  organisations_subdomain_key: 'subdomain_taken',
  admins_email_key: 'email_taken',
};

@Injectable()
export class OrganisationService {
  private readonly productName: string;
  private readonly signupLimit: RequestLimit;

  constructor(
    private readonly organisations: OrganisationRepository,
    private readonly legalAcceptances: LegalAcceptanceRepository,
    private readonly encryption: EncryptionService,
    private readonly admins: AdminService,
    private readonly emailVerifications: EmailVerificationService,
    private readonly memberships: MembershipService,
    private readonly camps: CampService,
    private readonly audit: AuditService,
    private readonly sessions: SessionService,
    private readonly jobs: JobQueue,
    private readonly rateLimiter: RateLimiter,
    private readonly unitOfWork: UnitOfWork,
    private readonly clock: Clock,
    config: ConfigService<Env, true>,
  ) {
    this.productName = config.get('PRODUCT_NAME', { infer: true });
    this.signupLimit = config.get('requestLimits', { infer: true }).signup;
  }

  /**
   * Get an Organisation by id, or throw if missing.
   * @param id Organisation id
   */
  public getByIdOrThrow(id: string): Promise<OrganisationEntity> {
    return this.organisations.getByIdOrThrow(id);
  }

  /**
   * Get the current unit of work's Organisation.
   */
  public getCurrent(): Promise<OrganisationEntity> {
    return this.organisations.getByIdOrThrow(this.unitOfWork.organisationId);
  }

  /**
   * Create an Organisation with its data key, in the current platform unit of work.
   * @param input the Organisation
   */
  public async create(input: CreateOrganisation): Promise<OrganisationEntity> {
    const organisation = await this.organisations.create(input);

    await this.encryption.createDataKey(organisation.id);

    return organisation;
  }

  /**
   * Sign an Organisation up, in a platform unit of work that then enters it: the Organisation pending
   * approval with its data key, its first Camp, the signer as its first Owner and the accepted legal
   * versions, all audited and committed as one. The Platform operator is notified once it commits, and the
   * signer gets a link that verifies their email; they work signed in meanwhile. Every attempt counts
   * against the signup limit of the IP address and the signer's email, before anything else.
   * @param body what the signer entered
   * @param ipAddress where the signer acts from
   * @throws {ConflictException} when the legal versions are not the current ones, or the email has an
   * admin account
   * @throws {BadRequestException} when the password is too weak
   */
  public async signUp(body: SignUpOrganisationBody, ipAddress: string): Promise<IssuedSession> {
    await this.rateLimiter.admit(this.signupLimit, { ipAddress, target: body.email });

    if (LEGAL_DOCUMENTS.some((document) => body.acceptedVersions[document] !== CURRENT_LEGAL_VERSIONS[document])) {
      throw signUpError(ConflictException, 'legal_versions_outdated');
    }

    const { campName, email, password, acceptedVersions, ...identity } = body;
    const weakness = passwordProblem(password, { email, productName: this.productName });

    if (weakness !== null) {
      throw signUpError(BadRequestException, weakness);
    }

    // Before any insert, so the slow hash holds no lock on the subdomain or email a simultaneous signup waits for.
    const passwordHash = await hashPassword(password);

    await this.requireAvailableSubdomain(body.subdomain);

    if ((await this.admins.getByEmail(email)) !== null) {
      throw signUpError(ConflictException, 'email_taken');
    }

    const { organisation, admin } = await this.createOrganisationAndAdmin(
      { ...identity, displayName: campName },
      { email, passwordHash },
    );
    const acceptedAt = this.clock.now();
    const acceptances = await this.legalAcceptances.createMany(
      LEGAL_DOCUMENTS.map((document) => ({
        organisationId: organisation.id,
        document,
        version: acceptedVersions[document],
        acceptedAt,
        acceptedBy: admin.id,
      })),
    );

    await this.unitOfWork.enter(organisation.id);
    const actor: Actor = { kind: 'admin', identity: admin.id, ipAddress };

    await this.audit.record(actor, {
      action: 'organisation.create',
      target: { type: 'organisation', id: organisation.id },
      change: { before: null, after: organisation },
    });
    await this.audit.record(actor, {
      action: 'admin.create',
      target: { type: 'admin', id: admin.id },
      change: { before: null, after: admin },
    });

    for (const acceptance of acceptances) {
      await this.audit.record(actor, {
        action: 'legal_acceptance.create',
        target: { type: 'legal_acceptance', id: acceptance.id },
        change: { before: null, after: acceptance },
      });
    }

    await this.camps.createFirst(actor, { name: campName });
    await this.memberships.create(actor, { adminId: admin.id, owner: true });

    this.jobs.enqueue(organisationSignedUpJob, { organisationId: organisation.id });
    this.emailVerifications.send(admin.id);

    return this.sessions.startAdmin(admin.id);
  }

  /**
   * Create the Organisation and its first Owner's admin identity. A simultaneous signup that took the
   * subdomain or the email after the checks is refused with its code, not as a server error.
   * @param organisation the Organisation
   * @param admin the admin's email and password hash
   * @throws {ConflictException} when the subdomain or the email was taken meanwhile
   */
  private async createOrganisationAndAdmin(
    organisation: CreateOrganisation,
    admin: { email: string; passwordHash: string },
  ): Promise<{ organisation: OrganisationEntity; admin: AdminEntity }> {
    try {
      return { organisation: await this.create(organisation), admin: await this.admins.create(admin) };
    } catch (error) {
      const code = TAKEN_BY_CONSTRAINT[violatedConstraint(error, 'unique') ?? ''];

      throw code === undefined ? error : signUpError(ConflictException, code);
    }
  }

  /**
   * Refuse a subdomain an Organisation cannot have: malformed, reserved or taken.
   * @param subdomain the subdomain, lowercase
   * @throws {BadRequestException} when it is malformed or reserved
   * @throws {ConflictException} when another Organisation has it
   */
  private async requireAvailableSubdomain(subdomain: string): Promise<void> {
    const problem = subdomainProblem(subdomain, this.productName);

    if (problem !== null) {
      throw signUpError(BadRequestException, problem);
    }

    if ((await this.organisations.getBySubdomain(subdomain)) !== null) {
      throw signUpError(ConflictException, 'subdomain_taken');
    }
  }
}

/**
 * Build a refused signup's exception with the code the app translates.
 * @param Exception the HTTP exception
 * @param code the code
 */
function signUpError(
  Exception: typeof BadRequestException | typeof ConflictException,
  code: SignUpErrorCode | SubdomainErrorCode | PasswordErrorCode,
): BadRequestException | ConflictException {
  return new Exception({ code, message: `Signup refused: ${code}` });
}
