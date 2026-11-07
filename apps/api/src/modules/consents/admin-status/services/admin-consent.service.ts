import { Injectable, NotFoundException } from '@nestjs/common';

import type { ConsentState, RegistrationConsents, TurnusConsents } from '@repo/schema/consents';
import type { FileLink } from '@repo/schema/files';

import type { Actor } from '../../../../core/audit/actor.ts';
import { AuditService } from '../../../../core/audit/audit.service.ts';
import { FileService } from '../../../../core/files/file.service.ts';
import { TurnusRepository } from '../../../../repositories/camps/turnus/turnus.repository.ts';
import {
  ConsentSignatureRepository,
  type ConsentSignatureRow,
} from '../../../../repositories/consents/consent-signature/consent-signature.repository.ts';
import {
  ConsentRepository,
  type ConsentRow,
  type ConsentVersionRow,
} from '../../../../repositories/consents/consent/consent.repository.ts';
import { RegistrationRepository } from '../../../../repositories/registrations/registration/registration.repository.ts';

/**
 * Tell a state from the newest signature.
 * @param newest the newest signature, if any
 * @param withdrawn when signatures were withdrawn, by id
 */
function stateOf(newest: ConsentSignatureRow | undefined, withdrawn: ReadonlyMap<string, Date>): ConsentState {
  if (newest === undefined) {
    return 'unsigned';
  }

  return withdrawn.has(newest.id) ? 'withdrawn' : 'signed';
}

// What admins see of Consents: each child's state on a Registration and across a Turnus, and every signed
// PDF. Permission (Registrations read) is the route's.
@Injectable()
export class AdminConsentService {
  constructor(
    private readonly consents: ConsentRepository,
    private readonly signatures: ConsentSignatureRepository,
    private readonly registrations: RegistrationRepository,
    private readonly turnusy: TurnusRepository,
    private readonly files: FileService,
    private readonly audit: AuditService,
  ) {}

  /**
   * Show each child's Consents on a Registration, with every signature and the items declined.
   * @param registrationId Registration id
   */
  public async ofRegistration(registrationId: string): Promise<RegistrationConsents> {
    const registration = await this.registrations.getByIdOrThrow(registrationId);
    const turnus = await this.turnusy.getByIdOrThrow(registration.turnusId);
    const participants = await this.registrations.listParticipants(registration.id);
    const consents = await this.consents.listByCamp(turnus.campId);
    const versions = await this.versionsOf(consents);
    const signatures = await this.signatures.listOf(participants.map(({ id }) => id));
    const withdrawn = await this.signatures.withdrawnAtOf(signatures.map(({ id }) => id));
    const byChildAndConsent = Map.groupBy(
      signatures,
      ({ participantId, consentId }) => `${participantId}:${consentId}`,
    );

    return {
      participants: participants.map((participant) => ({
        id: participant.id,
        firstName: participant.firstName,
        lastName: participant.lastName,
        consents: consents.flatMap((consent) => {
          const newestVersion = versions.byConsent.get(consent.id);
          const own = byChildAndConsent.get(`${participant.id}:${consent.id}`) ?? [];
          const [inForce] = own;
          const state = stateOf(inForce, withdrawn);
          const signedVersion = inForce === undefined ? undefined : versions.byId.get(inForce.consentVersionId);

          return newestVersion === undefined
            ? []
            : [
                {
                  consentId: consent.id,
                  title: newestVersion.title,
                  state,
                  declinedItems:
                    state !== 'signed' || inForce === undefined || signedVersion === undefined
                      ? []
                      : signedVersion.items
                          .filter(({ id, kind }) => kind === 'yes_no' && inForce.answers[id] === false)
                          .map(({ text }) => text),
                  signatures: own.map((signature, index) => ({
                    id: signature.id,
                    version: versions.byId.get(signature.consentVersionId)?.version ?? 0,
                    signerName: signature.signerName,
                    signedAt: signature.signedAt.toISOString(),
                    withdrawnAt: withdrawn.get(signature.id)?.toISOString() ?? null,
                    superseded: index > 0,
                    hasPdf: signature.fileId !== null,
                  })),
                },
              ];
        }),
      })),
    };
  }

  /**
   * Show a Turnus's Registered children against the Camp's Consents.
   * @param turnusId Turnus id
   */
  public async ofTurnus(turnusId: string): Promise<TurnusConsents> {
    const turnus = await this.turnusy.getByIdOrThrow(turnusId);
    const consents = await this.consents.listByCamp(turnus.campId);
    const versions = await this.versionsOf(consents);
    const registrations = await this.registrations.listByTurnus(turnus.id);
    const participants = (await this.registrations.listParticipantsOf(registrations.map(({ id }) => id)))
      .filter(({ status }) => status === 'registered')
      .toSorted(
        (one, other) =>
          one.lastName.localeCompare(other.lastName, 'cs') || one.firstName.localeCompare(other.firstName, 'cs'),
      );
    const newest = await this.signatures.listNewestOf(participants.map(({ id }) => id));
    const withdrawn = await this.signatures.withdrawnAtOf(newest.map(({ id }) => id));
    const newestOf = new Map(
      newest.map((signature) => [`${signature.participantId}:${signature.consentId}`, signature]),
    );
    const shown = consents.filter(({ id }) => versions.byConsent.has(id));

    return {
      consents: shown.map(({ id }) => ({ id, title: versions.byConsent.get(id)?.title ?? '' })),
      participants: participants.map((participant) => ({
        id: participant.id,
        registrationId: participant.registrationId,
        firstName: participant.firstName,
        lastName: participant.lastName,
        states: Object.fromEntries(
          shown.map(({ id }) => [id, stateOf(newestOf.get(`${participant.id}:${id}`), withdrawn)]),
        ),
      })),
    };
  }

  /**
   * Give a short-lived link to a signature's signed PDF, audited.
   * @param actor the admin
   * @param signatureId signature id
   * @throws {NotFoundException} when no signature of the Organisation has a signed PDF by that id
   */
  public async download(actor: Actor, signatureId: string): Promise<FileLink> {
    const signature = await this.signatures.getById(signatureId);

    if (signature?.fileId === undefined || signature.fileId === null) {
      throw new NotFoundException();
    }

    await this.audit.record(actor, {
      action: 'consent_signature.download',
      target: { type: 'consent_signature', id: signature.id },
    });

    return this.files.link(signature.fileId);
  }

  /**
   * Index the versions of Consents by id, and their newest by Consent.
   * @param consents the Consents
   */
  private async versionsOf(
    consents: readonly ConsentRow[],
  ): Promise<{ byId: Map<string, ConsentVersionRow>; byConsent: Map<string, ConsentVersionRow> }> {
    const all = await this.consents.listVersionsOf(consents.map(({ id }) => id));
    const byConsent = new Map<string, ConsentVersionRow>();

    // Newest first within each Consent, so the first seen is the newest.
    for (const version of all) {
      if (!byConsent.has(version.consentId)) {
        byConsent.set(version.consentId, version);
      }
    }

    return { byId: new Map(all.map((version) => [version.id, version])), byConsent };
  }
}
