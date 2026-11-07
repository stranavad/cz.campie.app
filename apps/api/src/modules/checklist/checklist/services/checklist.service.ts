import { Injectable, NotFoundException } from '@nestjs/common';

import { REGISTRATION_FIELD_CATALOGUE } from '@repo/schema/camps';
import { checklistOf, type ChecklistItem, type GuardianChecklist, type RequirementState } from '@repo/schema/checklist';
import type { ConsentState } from '@repo/schema/consents';
import { missingNewAnswers } from '@repo/schema/form-engine';

import { CampRepository } from '../../../../repositories/camps/camp/camp.repository.ts';
import { RegistrationFormRepository } from '../../../../repositories/camps/registration-form/registration-form.repository.ts';
import { TurnusRepository } from '../../../../repositories/camps/turnus/turnus.repository.ts';
import { ConsentSignatureRepository } from '../../../../repositories/consents/consent-signature/consent-signature.repository.ts';
import { ConsentRepository } from '../../../../repositories/consents/consent/consent.repository.ts';
import { DocumentTypeRepository } from '../../../../repositories/documents/document-type/document-type.repository.ts';
import { DocumentUploadRepository } from '../../../../repositories/documents/document-upload/document-upload.repository.ts';
import type { RegistrationEntity } from '../../../../repositories/registrations/registration/registration.entity.ts';
import { RegistrationRepository } from '../../../../repositories/registrations/registration/registration.repository.ts';
import { LedgerService } from '../../../registrations/ledger/services/ledger.service.ts';

// A child's checklist with who the child is.
export interface ParticipantChecklist {
  readonly participantId: string;
  readonly registrationId: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly items: ChecklistItem[];
}

// Each Registered child's checklist, gathered from what every module reports: the money, answers owed to
// fields added later, Consents and document requirements. One Turnus at a time, in a few queries, so the
// portal, admin filters and reminders read the same items.
@Injectable()
export class ChecklistService {
  constructor(
    private readonly registrations: RegistrationRepository,
    private readonly turnusy: TurnusRepository,
    private readonly camps: CampRepository,
    private readonly forms: RegistrationFormRepository,
    private readonly consents: ConsentRepository,
    private readonly signatures: ConsentSignatureRepository,
    private readonly types: DocumentTypeRepository,
    private readonly uploads: DocumentUploadRepository,
    private readonly ledger: LedgerService,
  ) {}

  /**
   * Show the checklists of a guardian's Registration, one per Registered child.
   * @param email the signed-in guardian's email
   * @param registrationId Registration id
   * @throws {NotFoundException} when the guardian has no access to the Registration
   */
  public async forGuardian(email: string, registrationId: string): Promise<GuardianChecklist> {
    const registration = await this.registrations.getByGuardian(email, registrationId);

    if (registration === null) {
      throw new NotFoundException();
    }

    const checklists = await this.ofRegistrations(registration.turnusId, [registration]);

    return {
      participants: checklists.map(({ participantId, firstName, lastName, items }) => ({
        id: participantId,
        firstName,
        lastName,
        items,
      })),
    };
  }

  /**
   * Gather the checklists of every Registered child of a Turnus.
   * @param turnusId Turnus id
   */
  public async ofTurnus(turnusId: string): Promise<ParticipantChecklist[]> {
    return this.ofRegistrations(turnusId, await this.registrations.listByTurnus(turnusId));
  }

  /**
   * Gather the checklists of a Registration's Registered children.
   * @param registrationId Registration id
   */
  public async ofRegistration(registrationId: string): Promise<ParticipantChecklist[]> {
    const registration = await this.registrations.getByIdOrThrow(registrationId);

    return this.ofRegistrations(registration.turnusId, [registration]);
  }

  /**
   * Gather the checklists of the Registered children of some of a Turnus's Registrations.
   * @param turnusId the Turnus they are in
   * @param registrations the Registrations
   */
  private async ofRegistrations(
    turnusId: string,
    registrations: readonly RegistrationEntity[],
  ): Promise<ParticipantChecklist[]> {
    const turnus = await this.turnusy.getByIdOrThrow(turnusId);
    const camp = await this.camps.getByIdOrThrow(turnus.campId);
    const participants = (await this.registrations.listParticipantsOf(registrations.map(({ id }) => id))).filter(
      ({ status }) => status === 'registered',
    );
    const childIds = participants.map(({ id }) => id);
    const balances = await this.ledger.balancesOf(turnus, registrations);
    const latest = await this.forms.getLatestVersion(camp.id);
    const versions = new Map(
      (await this.forms.listVersionsByIds([...new Set(registrations.map(({ formVersionId }) => formVersionId))])).map(
        (version) => [version.id, version],
      ),
    );
    const consentStates = await this.consentStatesOf(camp.id, childIds);
    const requirementStates = await this.requirementStatesOf(camp.id, childIds);
    const registrationOf = new Map(registrations.map((registration) => [registration.id, registration]));
    const modules = {
      consents: camp.modules.includes('consents'),
      documents: camp.modules.includes('documents'),
      healthRecord: camp.modules.includes('healthRecord'),
    };

    return participants.flatMap((participant) => {
      const registration = registrationOf.get(participant.registrationId);
      const balance = registration === undefined ? undefined : balances.get(registration.id);
      const version = registration === undefined ? undefined : versions.get(registration.formVersionId);
      const items =
        registration === undefined || balance === undefined
          ? null
          : checklistOf({
              participantStatus: participant.status,
              modules,
              payment: { amountDue: balance.amountDue.amount, dueDate: balance.amountDue.dueDate },
              missingAnswers:
                version === undefined || latest === null
                  ? 0
                  : missingNewAnswers(version.definition, latest.definition, REGISTRATION_FIELD_CATALOGUE, {
                      registration: registration.answers,
                      participant: participant.answers,
                    }),
              consents: consentStates.get(participant.id) ?? [],
              healthRecord: null,
              requirements: requirementStates.get(participant.id) ?? [],
            });

      return items === null
        ? []
        : [
            {
              participantId: participant.id,
              registrationId: participant.registrationId,
              firstName: participant.firstName,
              lastName: participant.lastName,
              items,
            },
          ];
    });
  }

  /**
   * Find each child's state of every Consent of a Camp, by the newest signature.
   * @param campId Camp id
   * @param childIds Participant ids
   */
  private async consentStatesOf(
    campId: string,
    childIds: readonly string[],
  ): Promise<Map<string, { consentId: string; title: string; state: ConsentState }[]>> {
    const consents = await this.consents.listByCamp(campId);
    const newestVersions = await this.consents.listNewestVersionsOf(consents.map(({ id }) => id));
    const signed = await this.signatures.listNewestOf(childIds);
    const withdrawn = await this.signatures.withdrawnAtOf(signed.map(({ id }) => id));
    const signatureOf = new Map(
      signed.map((signature) => [`${signature.participantId}:${signature.consentId}`, signature]),
    );

    return new Map(
      childIds.map((childId) => [
        childId,
        newestVersions.map(({ consentId, title }) => {
          const signature = signatureOf.get(`${childId}:${consentId}`);
          const state: ConsentState =
            signature === undefined ? 'unsigned' : withdrawn.has(signature.id) ? 'withdrawn' : 'signed';

          return { consentId, title, state };
        }),
      ]),
    );
  }

  /**
   * Find each child's state of every requirement of a Camp, by the newest document handed in.
   * @param campId Camp id
   * @param childIds Participant ids
   */
  private async requirementStatesOf(
    campId: string,
    childIds: readonly string[],
  ): Promise<Map<string, { documentTypeId: string; name: string; dueDate: string | null; state: RequirementState }[]>> {
    const requirements = (await this.types.listByCamp(campId)).filter(({ kind }) => kind === 'requirement');
    const newest = new Map<string, RequirementState>();

    // Newest first, so the first seen per child and requirement is its state.
    for (const upload of await this.uploads.listOf(childIds)) {
      const key = `${upload.participantId}:${upload.documentTypeId}`;

      if (!newest.has(key)) {
        newest.set(key, upload.status);
      }
    }

    return new Map(
      childIds.map((childId) => [
        childId,
        requirements.map(({ id, name, dueDate }) => ({
          documentTypeId: id,
          name,
          dueDate,
          state: newest.get(`${childId}:${id}`) ?? 'missing',
        })),
      ]),
    );
  }
}
