import { Injectable } from '@nestjs/common';
import { and, asc, desc, eq, inArray } from 'drizzle-orm';

import type { AuditEncryptedField, AuditEntry, AuditTarget } from '@repo/schema/audit';
import { isRegistrationFieldKey, REGISTRATION_FIELD_CATALOGUE } from '@repo/schema/camps';
import { sensitiveKeys, type FormDefinition } from '@repo/schema/form-engine';
import type { Person } from '@repo/schema/shared';

import { UnitOfWork } from '../../../../core/database/unit-of-work.ts';
import {
  admins,
  camps,
  consents,
  consentVersions,
  discountCodes,
  documentTypes,
  invitations,
  memberships,
  organisations,
  participants,
  registrationFormVersions,
  registrations,
  turnusy,
  undeliverableEmails,
} from '../../../../db/schema.ts';
import { AdminRepository } from '../../../../repositories/admins/admin/admin.repository.ts';
import type { AuditEntryRow } from '../../../../repositories/audit/audit-entry/audit-entry.repository.ts';

type Named = Omit<AuditTarget, 'type' | 'id'>;

const UNNAMED: Named = { label: null, variableSymbol: null, state: 'present', link: null };
const REMOVED: Named = { label: null, variableSymbol: null, state: 'removed', link: null };
const ERASED: Named = { label: null, variableSymbol: null, state: 'erased', link: null };

// The kinds of record named by a Camp: the Camp itself, its registration form and its email texts.
const CAMP_TARGETS = new Set(['camp', 'registration_form', 'camp_email_text']);

// Audit entries as admins read them: each record named as it is now, and encrypted form fields by their
// labels. Everything is read in the current Organisation's unit of work, so another Organisation's record
// never names an entry; a record that is gone reads as removed.
@Injectable()
export class AuditEntryService {
  constructor(
    private readonly unitOfWork: UnitOfWork,
    private readonly admins: AdminRepository,
  ) {}

  /**
   * Shape audit entries for reading: actors by email and name, records by name, encrypted fields by label, and
   * nothing about health data for an admin without Health read.
   * @param rows the entries, in the order to show them
   * @param healthRead whether the admin may read health data
   */
  public async present(rows: readonly AuditEntryRow[], healthRead: boolean): Promise<AuditEntry[]> {
    // Who viewed or changed health data is itself health data, and so are the names of its fields.
    const shown = rows.filter(({ action }) => healthRead || !action.startsWith('health'));
    // Admins as they are named now: the log keeps their id only, so a rename shows on their past entries.
    const people = await this.admins.listPeopleByIds([
      ...new Set(
        shown.flatMap(({ actorKind, actorIdentity }) =>
          (actorKind === 'admin' || actorKind === 'operator') && actorIdentity !== null ? [actorIdentity] : [],
        ),
      ),
    ]);
    const { names, registrationOf } = await this.targetsOf(shown);
    const fieldsOf = await this.encryptedFieldsOf(shown, registrationOf, healthRead);

    return shown.map((entry) => ({
      id: entry.id,
      occurredAt: entry.occurredAt.toISOString(),
      actor: { kind: entry.actorKind, ...this.actorOf(entry, people) },
      ipAddress: entry.ipAddress,
      action: entry.action,
      target: {
        type: entry.targetType,
        id: entry.targetId,
        ...(names.get(`${entry.targetType}:${entry.targetId}`) ?? UNNAMED),
      },
      changes: entry.changes,
      encryptedFields: fieldsOf(entry),
    }));
  }

  /**
   * Name an entry's actor: an admin or the operator by their email and name now, a guardian by the email
   * recorded, the system or an erased identity by nothing.
   * @param entry the entry
   * @param people admins by id
   */
  private actorOf(entry: AuditEntryRow, people: ReadonlyMap<string, Person>): Omit<AuditEntry['actor'], 'kind'> {
    const nobody = { email: null, firstName: null, lastName: null };

    if (entry.actorIdentity === null) {
      return nobody;
    }

    if (entry.actorKind === 'guardian') {
      return { ...nobody, email: entry.actorIdentity };
    }

    return people.get(entry.actorIdentity) ?? nobody;
  }

  /**
   * Name the entries' records as they are now, by kind; a kind the log does not name stays unnamed.
   * @param entries the entries
   */
  private async targetsOf(entries: readonly AuditEntryRow[]): Promise<{
    names: Map<string, Named>;
    registrationOf: Map<string, string>;
  }> {
    const idsOf = (...types: string[]) => [
      ...new Set(entries.filter(({ targetType }) => types.includes(targetType)).map(({ targetId }) => targetId)),
    ];
    const names = new Map<string, Named>();
    // The Registration each Registration or Participant target belongs to, for its form's field labels.
    const registrationOf = new Map<string, string>();
    const name = (types: readonly string[], ids: readonly string[], found: Map<string, Named>) => {
      for (const type of types) {
        for (const id of ids) {
          names.set(`${type}:${id}`, found.get(id) ?? REMOVED);
        }
      }
    };
    const plainly = (rows: { id: string; label: string }[]) =>
      new Map(rows.map(({ id, label }): [string, Named] => [id, { ...UNNAMED, label }]));

    const campIds = idsOf(...CAMP_TARGETS);
    name(
      [...CAMP_TARGETS],
      campIds,
      new Map(
        (
          await this.select(campIds, (ids) =>
            this.unitOfWork.db.select({ id: camps.id, label: camps.name }).from(camps).where(inArray(camps.id, ids)),
          )
        ).map(({ id, label }): [string, Named] => [id, { ...UNNAMED, label, link: { page: 'camp', campId: id } }]),
      ),
    );

    const participantRows = await this.select(idsOf('participant'), (ids) =>
      this.unitOfWork.db
        .select({ id: participants.id, registrationId: participants.registrationId })
        .from(participants)
        .where(inArray(participants.id, ids)),
    );

    for (const { id, registrationId } of participantRows) {
      registrationOf.set(id, registrationId);
    }

    const registrationIds = idsOf('registration');

    for (const id of registrationIds) {
      registrationOf.set(id, id);
    }

    const registered = await this.registrationsOf([...new Set(registrationOf.values())]);
    name(['registration'], registrationIds, registered.registrations);
    name(['participant'], idsOf('participant'), registered.participants);

    // Records named by one of their columns. Memberships, admins, invitations and Organisations are platform
    // tables, so they are kept to the current Organisation by hand.
    const db = this.unitOfWork.db;
    const organisationId = this.unitOfWork.organisationId;
    const labels: Record<string, (ids: string[]) => Promise<{ id: string; label: string }[]>> = {
      turnus: (ids) => db.select({ id: turnusy.id, label: turnusy.name }).from(turnusy).where(inArray(turnusy.id, ids)),
      membership: (ids) =>
        db
          .select({ id: memberships.id, label: admins.email })
          .from(memberships)
          .innerJoin(admins, eq(admins.id, memberships.adminId))
          .where(and(inArray(memberships.id, ids), eq(memberships.organisationId, organisationId))),
      admin: (ids) =>
        db
          .select({ id: admins.id, label: admins.email })
          .from(admins)
          .innerJoin(memberships, eq(memberships.adminId, admins.id))
          .where(and(inArray(admins.id, ids), eq(memberships.organisationId, organisationId))),
      invitation: (ids) =>
        db
          .select({ id: invitations.id, label: invitations.email })
          .from(invitations)
          .where(and(inArray(invitations.id, ids), eq(invitations.organisationId, organisationId))),
      organisation: (ids) =>
        db
          .select({ id: organisations.id, label: organisations.displayName })
          .from(organisations)
          .where(and(inArray(organisations.id, ids), eq(organisations.id, organisationId))),
      document_type: (ids) =>
        db
          .select({ id: documentTypes.id, label: documentTypes.name })
          .from(documentTypes)
          .where(inArray(documentTypes.id, ids)),
      discount_code: (ids) =>
        db
          .select({ id: discountCodes.id, label: discountCodes.code })
          .from(discountCodes)
          .where(inArray(discountCodes.id, ids)),
      undeliverable_email: (ids) =>
        db
          .select({ id: undeliverableEmails.id, label: undeliverableEmails.email })
          .from(undeliverableEmails)
          .where(inArray(undeliverableEmails.id, ids)),
    };

    for (const [type, read] of Object.entries(labels)) {
      const ids = idsOf(type);

      name([type], ids, plainly(await this.select(ids, read)));
    }

    const consentIds = idsOf('consent');
    const consentRows = await this.select(consentIds, (ids) =>
      this.unitOfWork.db
        .select({ id: consents.id, title: consentVersions.title })
        .from(consents)
        .leftJoin(consentVersions, eq(consentVersions.consentId, consents.id))
        .where(inArray(consents.id, ids))
        .orderBy(desc(consentVersions.version)),
    );
    // Newest version first, so a Consent is named by its current title; one not yet published has none.
    const consentNames = new Map<string, Named>();

    for (const { id, title } of consentRows) {
      if (!consentNames.has(id)) {
        consentNames.set(id, { ...UNNAMED, label: title });
      }
    }

    name(['consent'], consentIds, consentNames);

    return { names, registrationOf };
  }

  /**
   * Name Registrations by their Participants and Variable symbol, and Participants by their names, both
   * linked to the Registration; an Erased Registration and its Participants by nothing personal.
   * @param ids Registration ids
   */
  private async registrationsOf(
    ids: readonly string[],
  ): Promise<{ registrations: Map<string, Named>; participants: Map<string, Named> }> {
    const found = await this.select(ids, (some) =>
      this.unitOfWork.db
        .select({
          id: registrations.id,
          variableSymbol: registrations.variableSymbol,
          erasedAt: registrations.erasedAt,
        })
        .from(registrations)
        .where(inArray(registrations.id, some)),
    );
    const children = await this.select(ids, (some) =>
      this.unitOfWork.db
        .select({
          id: participants.id,
          registrationId: participants.registrationId,
          firstName: participants.firstName,
          lastName: participants.lastName,
        })
        .from(participants)
        .where(inArray(participants.registrationId, some))
        .orderBy(asc(participants.position)),
    );
    const registrationNames = new Map<string, Named>();
    const participantNames = new Map<string, Named>();

    for (const registration of found) {
      const link = { page: 'registration', registrationId: registration.id } as const;
      const own = children.filter(({ registrationId }) => registrationId === registration.id);

      registrationNames.set(
        registration.id,
        registration.erasedAt === null
          ? {
              label: own.map(({ firstName, lastName }) => `${firstName} ${lastName}`).join(', '),
              variableSymbol: registration.variableSymbol,
              state: 'present',
              link,
            }
          : ERASED,
      );

      for (const child of own) {
        participantNames.set(
          child.id,
          registration.erasedAt === null ? { ...UNNAMED, label: `${child.firstName} ${child.lastName}`, link } : ERASED,
        );
      }
    }

    return { registrations: registrationNames, participants: participantNames };
  }

  /**
   * Label the encrypted fields of entries on Registrations and Participants by the Registration's form: a
   * standard field by the platform's label key, a custom one by its label in the Registration's version, or
   * the newest version of the Camp's form that asks it. Health fields are left out without Health read.
   * @param entries the entries
   * @param registrationOf the Registration each Registration or Participant target belongs to
   * @param healthRead whether the admin may read health data
   */
  private async encryptedFieldsOf(
    entries: readonly AuditEntryRow[],
    registrationOf: ReadonlyMap<string, string>,
    healthRead: boolean,
  ): Promise<(entry: AuditEntryRow) => AuditEncryptedField[]> {
    const labelled = entries.filter(({ encryptedFields }) => encryptedFields.length > 0);
    const registrationIds = [...new Set(labelled.flatMap(({ targetId }) => registrationOf.get(targetId) ?? []))];
    const forms = await this.select(registrationIds, (ids) =>
      this.unitOfWork.db
        .select({ id: registrations.id, formVersionId: registrations.formVersionId, campId: turnusy.campId })
        .from(registrations)
        .innerJoin(turnusy, eq(turnusy.id, registrations.turnusId))
        .where(inArray(registrations.id, ids)),
    );
    const versions = await this.select([...new Set(forms.map(({ campId }) => campId))], (ids) =>
      this.unitOfWork.db
        .select({
          id: registrationFormVersions.id,
          campId: registrationFormVersions.campId,
          definition: registrationFormVersions.definition,
        })
        .from(registrationFormVersions)
        .where(inArray(registrationFormVersions.campId, ids))
        .orderBy(desc(registrationFormVersions.version)),
    );
    // Each Registration's own form first, then the Camp's other versions, newest first.
    const definitionsOf = new Map(
      forms.map(({ id, formVersionId, campId }): [string, FormDefinition[]] => [
        id,
        [
          ...versions.filter((version) => version.id === formVersionId),
          ...versions.filter((version) => version.campId === campId && version.id !== formVersionId),
        ].map(({ definition }) => definition),
      ]),
    );

    return (entry) => {
      const registrationId = registrationOf.get(entry.targetId);
      const definitions = registrationId === undefined ? [] : (definitionsOf.get(registrationId) ?? []);
      const sensitive = sensitiveKeys(definitions, REGISTRATION_FIELD_CATALOGUE);

      return entry.encryptedFields
        .filter((field) => healthRead || sensitive.get(field) !== 'health')
        .map((field) => {
          if (registrationId === undefined) {
            return { field, label: null, labelKey: null };
          }

          if (isRegistrationFieldKey(field)) {
            return { field, label: null, labelKey: REGISTRATION_FIELD_CATALOGUE[field].labelKey };
          }

          const custom = definitions.flatMap(({ custom: fields }) => fields).find(({ id }) => id === field);

          return { field, label: custom?.label ?? null, labelKey: null };
        });
    };
  }

  /**
   * Run a read for some ids, or none when there are none.
   * @param ids the ids
   * @param read the read
   */
  private async select<T>(ids: readonly string[], read: (ids: string[]) => Promise<T[]>): Promise<T[]> {
    return ids.length === 0 ? [] : read([...ids]);
  }
}
