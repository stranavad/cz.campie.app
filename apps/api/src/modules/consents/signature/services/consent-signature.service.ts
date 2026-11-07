import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import {
  checkConsentAnswers,
  type ConsentState,
  type ConsentVersion,
  type GuardianConsent,
  type GuardianConsentParams,
  type GuardianConsents,
  type SignConsentBody,
  type SignConsentErrorCode,
  type WithdrawConsentErrorCode,
} from '@repo/schema/consents';
import { czechDate, czechDateTime } from '@repo/schema/shared';

import type { Actor } from '../../../../core/audit/actor.ts';
import { AuditService } from '../../../../core/audit/audit.service.ts';
import type { Env } from '../../../../core/config/env.schema.ts';
import { DocumentService } from '../../../../core/documents/document.service.ts';
import { FileService } from '../../../../core/files/file.service.ts';
import { JobQueue } from '../../../../core/jobs/job-queue.ts';
import { Clock } from '../../../../core/ports/clock/clock.port.ts';
import { RateLimiter, type RequestLimit } from '../../../../core/rate-limits/rate-limiter.ts';
import type { CampEntity } from '../../../../repositories/camps/camp/camp.entity.ts';
import { CampRepository } from '../../../../repositories/camps/camp/camp.repository.ts';
import { TurnusRepository } from '../../../../repositories/camps/turnus/turnus.repository.ts';
import {
  ConsentSignatureRepository,
  type ConsentSignatureRow,
} from '../../../../repositories/consents/consent-signature/consent-signature.repository.ts';
import {
  ConsentRepository,
  type ConsentVersionRow,
} from '../../../../repositories/consents/consent/consent.repository.ts';
import { OrganisationRepository } from '../../../../repositories/organisations/organisation/organisation.repository.ts';
import type { ParticipantEntity } from '../../../../repositories/registrations/participant/participant.entity.ts';
import { RegistrationRepository } from '../../../../repositories/registrations/registration/registration.repository.ts';
import { effectiveBranding } from '../../../camps/camp-branding/services/camp-branding.service.ts';
import { CampEmailService } from '../../../camps/camp-email/services/camp-email.service.ts';
import { generateSignedConsentJob, sendConsentCopyJob } from '../signature.jobs.ts';
import { SignedConsentDocument } from '../signed-consent.document.tsx';

// A yes/no item a Participant's signature in force answered no, for printouts and filters.
export interface DeclinedItem {
  readonly participantId: string;
  readonly consentId: string;
  readonly itemId: string;
  readonly text: string;
}

interface Family {
  readonly camp: CampEntity;
  readonly participants: readonly ParticipantEntity[];
}

/**
 * Tell whether two sets of answers say the same.
 * @param one answers by item id
 * @param other answers by item id
 */
function sameAnswers(one: Readonly<Record<string, boolean>>, other: Readonly<Record<string, boolean>>): boolean {
  const keys = Object.keys(one);

  return keys.length === Object.keys(other).length && keys.every((key) => one[key] === other[key]);
}

/**
 * Tell a child's state of a Consent by its newest signature.
 * @param signature the newest signature, if any
 * @param withdrawn when signatures were withdrawn, by id
 */
function stateOf(signature: ConsentSignatureRow | undefined, withdrawn: ReadonlyMap<string, Date>): ConsentState {
  if (signature === undefined) {
    return 'unsigned';
  }

  return withdrawn.has(signature.id) ? 'withdrawn' : 'signed';
}

// Guardians reading and signing their children's Consents in the portal, by typed name and place: a simple
// electronic signature whose evidence is the guardian session. Guardians and access emails alike may sign.
@Injectable()
export class ConsentSignatureService {
  private readonly limit: RequestLimit;

  constructor(
    private readonly signatures: ConsentSignatureRepository,
    private readonly consents: ConsentRepository,
    private readonly registrations: RegistrationRepository,
    private readonly turnusy: TurnusRepository,
    private readonly camps: CampRepository,
    private readonly organisations: OrganisationRepository,
    private readonly documents: DocumentService,
    private readonly files: FileService,
    private readonly campEmails: CampEmailService,
    private readonly audit: AuditService,
    private readonly jobs: JobQueue,
    private readonly clock: Clock,
    private readonly rateLimiter: RateLimiter,
    config: ConfigService<Env, true>,
  ) {
    this.limit = config.get('requestLimits', { infer: true }).guardianAction;
  }

  /**
   * List every Consent of the Camp for each Registered child of a guardian's Registration, with its state.
   * @param email the signed-in guardian's email
   * @param registrationId Registration id
   */
  public async list(email: string, registrationId: string): Promise<GuardianConsents> {
    const { camp, participants } = await this.familyOf(email, registrationId);

    if (!camp.modules.includes('consents')) {
      return { participants: [] };
    }

    const consents = await this.consents.listByCamp(camp.id);
    const newest = new Map(
      (await this.consents.listNewestVersionsOf(consents.map(({ id }) => id))).map((version) => [
        version.consentId,
        version,
      ]),
    );
    const signed = await this.signatures.listNewestOf(participants.map(({ id }) => id));
    const withdrawn = await this.signatures.withdrawnAtOf(signed.map(({ id }) => id));
    const versions = new Map(
      (await this.consents.listVersionsOf(consents.map(({ id }) => id))).map((version) => [version.id, version]),
    );

    const summaryOf = async (participantId: string, consentId: string, version: ConsentVersionRow) => {
      const signature = signed.find(
        (candidate) => candidate.participantId === participantId && candidate.consentId === consentId,
      );

      return {
        consentId,
        title: version.title,
        state: stateOf(signature, withdrawn),
        signedVersion: signature === undefined ? null : (versions.get(signature.consentVersionId)?.version ?? null),
        signedAt: signature?.signedAt.toISOString() ?? null,
        signedPdf:
          signature === undefined || signature.fileId === null ? null : await this.files.link(signature.fileId),
      };
    };

    return {
      participants: await Promise.all(
        participants.map(async (participant) => ({
          id: participant.id,
          firstName: participant.firstName,
          lastName: participant.lastName,
          consents: await Promise.all(
            consents.flatMap(({ id }) => {
              const version = newest.get(id);

              return version === undefined ? [] : [summaryOf(participant.id, id, version)];
            }),
          ),
        })),
      ),
    };
  }

  /**
   * Get a Consent to read and sign for one child: its newest version and the child's newest signature.
   * @param email the signed-in guardian's email
   * @param params the Registration, Participant and Consent
   */
  public async get(email: string, params: GuardianConsentParams): Promise<GuardianConsent> {
    const { participant, version } = await this.signable(email, params);

    return this.show(participant, version, await this.signatures.getNewest(participant.id, params.consentId));
  }

  /**
   * Sign a Consent's newest version for one child, with the evidence of the guardian session, audited; the
   * signed PDF follows from a job.
   * @param actor the guardian
   * @param userAgent the browser
   * @param params the Registration, Participant and Consent
   * @param body the version read, the answers, and the typed name and place
   * @throws {ConflictException} consent_version_outdated when a newer version was published meanwhile
   * @throws {BadRequestException} consent_answers_invalid naming each item answered wrongly
   */
  public async sign(
    actor: Actor,
    userAgent: string,
    params: GuardianConsentParams,
    body: SignConsentBody,
  ): Promise<GuardianConsent> {
    if (actor.kind !== 'guardian') {
      throw new Error('Only a guardian signs a Consent');
    }

    await this.rateLimiter.admit(this.limit, { ipAddress: actor.ipAddress, target: actor.identity });
    // The Registration's lock keeps an erasure out until the signature commits; after one, the family is gone.
    await this.registrations.lockById(params.registrationId);
    const { participant, version } = await this.signable(actor.identity, params, true);

    if (version.id !== body.consentVersionId) {
      const code: SignConsentErrorCode = 'consent_version_outdated';

      throw new ConflictException({ code, message: 'A newer version of the Consent was published' });
    }

    const errors = checkConsentAnswers(version.items, body.answers);

    if (errors.length > 0) {
      const code: SignConsentErrorCode = 'consent_answers_invalid';

      throw new BadRequestException({
        code,
        message: 'The answers do not fit the Consent',
        fields: errors.map(({ itemId, code: reason }) => ({ path: ['answers', itemId], code: reason })),
      });
    }

    // Signing again the same answers to the same version, in force, changes nothing and sends nothing.
    const inForce = await this.signatures.getNewest(participant.id, params.consentId);

    if (
      inForce !== null &&
      inForce.consentVersionId === version.id &&
      !(await this.signatures.withdrawnAtOf([inForce.id])).has(inForce.id) &&
      sameAnswers(inForce.answers, body.answers)
    ) {
      return this.show(participant, version, inForce);
    }

    const signature = await this.signatures.create({
      participantId: participant.id,
      consentId: params.consentId,
      consentVersionId: version.id,
      answers: body.answers,
      signerName: body.signerName,
      signerPlace: body.signerPlace,
      signerEmail: actor.identity,
      ipAddress: actor.ipAddress,
      userAgent: userAgent.slice(0, 500),
      signedAt: this.clock.now(),
    });

    await this.audit.record(actor, {
      action: 'consent.sign',
      target: { type: 'participant', id: participant.id },
      change: { before: null, after: signature },
    });
    this.jobs.enqueue(generateSignedConsentJob, { signatureId: signature.id });

    return this.show(participant, version, signature);
  }

  /**
   * Withdraw a child's newest signature of a withdrawable Consent, audited; its signed PDF stays.
   * @param actor the guardian
   * @param params the Registration, Participant and Consent
   * @throws {ConflictException} consent_not_signed when no signature is in force; consent_not_withdrawable
   * when the version signed cannot be withdrawn
   */
  public async withdraw(actor: Actor, params: GuardianConsentParams): Promise<GuardianConsent> {
    if (actor.kind !== 'guardian') {
      throw new Error('Only a guardian withdraws a Consent');
    }

    const { participant, version } = await this.signable(actor.identity, params, true);
    const signature = await this.signatures.getNewest(participant.id, params.consentId);
    const refuse = (code: WithdrawConsentErrorCode) =>
      new ConflictException({ code, message: 'The signature cannot be withdrawn' });

    if (signature === null || (await this.signatures.withdrawnAtOf([signature.id])).has(signature.id)) {
      throw refuse('consent_not_signed');
    }

    if (!(await this.signedVersionOf(signature)).withdrawable) {
      throw refuse('consent_not_withdrawable');
    }

    const withdrawal = await this.signatures.addWithdrawal({
      signatureId: signature.id,
      withdrawnByEmail: actor.identity,
      ipAddress: actor.ipAddress,
      withdrawnAt: this.clock.now(),
    });

    await this.audit.record(actor, {
      action: 'consent.withdraw',
      target: { type: 'participant', id: participant.id },
      change: { before: null, after: withdrawal },
    });

    return this.show(participant, version, signature);
  }

  /**
   * List the yes/no items each of Participants declined, read from their signatures in force only.
   * @param participantIds Participant ids
   */
  public async declinedItemsOf(participantIds: readonly string[]): Promise<DeclinedItem[]> {
    const signed = await this.signatures.listNewestOf(participantIds);
    const withdrawn = await this.signatures.withdrawnAtOf(signed.map(({ id }) => id));
    const inForce = signed.filter(({ id }) => !withdrawn.has(id));
    const versions = new Map(
      (await this.consents.listVersionsOf([...new Set(inForce.map(({ consentId }) => consentId))])).map((version) => [
        version.id,
        version,
      ]),
    );

    return inForce.flatMap((signature) =>
      (versions.get(signature.consentVersionId)?.items ?? [])
        .filter(({ id, kind }) => kind === 'yes_no' && signature.answers[id] === false)
        .map(({ id, text }) => ({
          participantId: signature.participantId,
          consentId: signature.consentId,
          itemId: id,
          text,
        })),
    );
  }

  /**
   * Render a signature's signed PDF, store it and have it emailed to the guardians.
   * @param signatureId signature id
   */
  public async generatePdf(signatureId: string): Promise<void> {
    const signature = await this.signatures.getById(signatureId);

    if (signature === null || signature.fileId !== null) {
      return;
    }

    const [version] = (await this.consents.listVersionsOf([signature.consentId])).filter(
      ({ id }) => id === signature.consentVersionId,
    );
    if (version === undefined) {
      return;
    }

    const participant = await this.registrations.getParticipantOrThrow(signature.participantId);

    const registration = await this.registrations.getByIdOrThrow(participant.registrationId);
    const turnus = await this.turnusy.getByIdOrThrow(registration.turnusId);
    const camp = await this.camps.getByIdOrThrow(turnus.campId);
    const organisation = await this.organisations.getByIdOrThrow(camp.organisationId);
    const fileId = await this.documents.store(
      SignedConsentDocument,
      {
        campName: camp.name,
        participant: {
          name: `${participant.firstName} ${participant.lastName}`,
          birthDate: participant.birthDate === null ? '-' : czechDate(participant.birthDate),
        },
        consent: {
          title: version.title,
          version: version.version,
          introduction: version.introduction,
          withdrawable: version.withdrawable,
          fileSha256: version.fileSha256,
        },
        items: version.items.map(({ id, kind, text }) => ({ kind, text, answer: signature.answers[id] ?? null })),
        signer: {
          name: signature.signerName,
          place: signature.signerPlace,
          email: signature.signerEmail,
          signedAt: czechDateTime(signature.signedAt.toISOString()),
          ipAddress: signature.ipAddress,
          userAgent: signature.userAgent,
        },
      },
      `souhlas-${version.version}-${participant.id}.pdf`,
      { displayName: camp.name, ...effectiveBranding(camp, organisation) },
    );

    // A second run of the job, meanwhile, keeps the first PDF; this one goes.
    if (!(await this.signatures.setFile(signature.id, fileId))) {
      await this.files.remove(fileId);

      return;
    }

    (await this.registrations.listGuardians(registration.id)).forEach((_, index) =>
      this.jobs.enqueue(sendConsentCopyJob, { signatureId: signature.id, guardian: index + 1 }),
    );
  }

  /**
   * Email a signed PDF to one guardian, unless the Camp switched the copy off.
   * @param signatureId signature id
   * @param guardian the guardian's position, 1 or 2
   */
  public async sendCopy(signatureId: string, guardian: number): Promise<void> {
    const signature = await this.signatures.getById(signatureId);

    // A signature withdrawn before its copy went out is not sent any more.
    if (
      signature?.fileId === undefined ||
      signature.fileId === null ||
      (await this.signatures.withdrawnAtOf([signature.id])).has(signature.id)
    ) {
      return;
    }

    const participant = await this.registrations.getParticipantOrThrow(signature.participantId);
    const registration = await this.registrations.lockByIdOrThrow(participant.registrationId);

    // An erasure that came first removed the signature's family; nothing is left to print.
    if (registration.erasedAt !== null) {
      return;
    }

    const recipient = (await this.registrations.listGuardians(registration.id))[guardian - 1];
    const turnus = await this.turnusy.getByIdOrThrow(registration.turnusId);

    if (recipient !== undefined) {
      await this.campEmails.send(turnus.campId, 'consent_copy', {
        values: { deti: `${participant.firstName} ${participant.lastName}`, turnus: turnus.name },
        to: [recipient.email],
        attachments: [signature.fileId],
      });
    }
  }

  /**
   * Find the Camp and Registered children of a guardian's Registration.
   * @param email the guardian's email
   * @param registrationId Registration id
   * @throws {NotFoundException} when the guardian has no access to the Registration
   */
  private async familyOf(email: string, registrationId: string): Promise<Family> {
    const registration = await this.registrations.getByGuardian(email, registrationId);

    if (registration === null) {
      throw new NotFoundException();
    }

    const turnus = await this.turnusy.getByIdOrThrow(registration.turnusId);

    return {
      camp: await this.camps.getByIdOrThrow(turnus.campId),
      participants: (await this.registrations.listParticipants(registration.id)).filter(
        ({ status }) => status === 'registered',
      ),
    };
  }

  /**
   * Find what a guardian may sign: a Registered child of theirs and a Consent of its Camp by its newest
   * version, while the Camp's Consents are on.
   * @param email the guardian's email
   * @param params the Registration, Participant and Consent
   * @param lock whether to lock the Consent until the unit of work ends, so no version is published while
   * it is signed
   * @throws {NotFoundException} when any of them is not the guardian's to sign
   */
  private async signable(
    email: string,
    params: GuardianConsentParams,
    lock = false,
  ): Promise<{ participant: ParticipantEntity; version: ConsentVersionRow }> {
    const { camp, participants } = await this.familyOf(email, params.registrationId);
    const participant = participants.find(({ id }) => id === params.participantId);
    const consent = lock
      ? await this.consents.getForUpdate(camp.id, params.consentId)
      : await this.consents.get(camp.id, params.consentId);
    const [version] = consent === null ? [] : await this.consents.listNewestVersionsOf([consent.id]);

    if (!camp.modules.includes('consents') || participant === undefined || version === undefined) {
      throw new NotFoundException();
    }

    return { participant, version };
  }

  /**
   * Find the version a signature signed.
   * @param signature the signature
   * @throws {Error} when the version is gone, which its foreign key prevents
   */
  private async signedVersionOf(signature: ConsentSignatureRow): Promise<ConsentVersionRow> {
    const version = (await this.consents.listVersionsOf([signature.consentId])).find(
      ({ id }) => id === signature.consentVersionId,
    );

    if (version === undefined) {
      throw new Error('A signature names a version that does not exist');
    }

    return version;
  }

  /**
   * Show a Consent to sign for a child, with the child's newest signature.
   * @param participant the child
   * @param version the newest version
   * @param signature the newest signature, or null
   */
  private async show(
    participant: ParticipantEntity,
    version: ConsentVersionRow,
    signature: ConsentSignatureRow | null,
  ): Promise<GuardianConsent> {
    const shown: ConsentVersion = {
      id: version.id,
      version: version.version,
      title: version.title,
      introduction: version.introduction,
      items: version.items,
      withdrawable: version.withdrawable,
      file:
        version.fileId === null || version.fileSha256 === null
          ? null
          : { id: version.fileId, sha256: version.fileSha256, link: await this.files.link(version.fileId) },
      publishedAt: version.publishedAt.toISOString(),
    };

    const withdrawnAt =
      signature === null ? undefined : (await this.signatures.withdrawnAtOf([signature.id])).get(signature.id);
    const withdrawable =
      signature !== null && withdrawnAt === undefined && (await this.signedVersionOf(signature)).withdrawable;

    return {
      participant: { id: participant.id, firstName: participant.firstName, lastName: participant.lastName },
      version: shown,
      withdrawable,
      signature:
        signature === null
          ? null
          : {
              consentVersionId: signature.consentVersionId,
              answers: signature.answers,
              signerName: signature.signerName,
              signerPlace: signature.signerPlace,
              signedAt: signature.signedAt.toISOString(),
              signedPdf: signature.fileId === null ? null : await this.files.link(signature.fileId),
              withdrawnAt: withdrawnAt?.toISOString() ?? null,
            },
    };
  }
}
