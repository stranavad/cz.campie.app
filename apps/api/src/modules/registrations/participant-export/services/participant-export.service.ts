import { Injectable, NotFoundException } from '@nestjs/common';
import ExcelJS from 'exceljs';

import { ageOnStart, REGISTRATION_FIELD_CATALOGUE } from '@repo/schema/camps';
import { XLSX_CONTENT_TYPE } from '@repo/schema/files';
import {
  columnCatalogue,
  withOptionLabels,
  type Answers,
  type AnswerValue,
  type FormColumn,
  type FormDefinition,
} from '@repo/schema/form-engine';
import type { Balance } from '@repo/schema/pricing';
import {
  FIXED_EXPORT_COLUMNS,
  type ExportOptions,
  type ExportPreset,
  type FixedExportColumn,
  type ParticipantExport,
  type SaveExportPresetBody,
  type StartParticipantExportBody,
} from '@repo/schema/registrations';
import { czechDate, czechDateTime } from '@repo/schema/shared';

import type { Actor } from '../../../../core/audit/actor.ts';
import { AuditService } from '../../../../core/audit/audit.service.ts';
import { UnitOfWork } from '../../../../core/database/unit-of-work.ts';
import { FileService } from '../../../../core/files/file.service.ts';
import { JobQueue } from '../../../../core/jobs/job-queue.ts';
import { Clock } from '../../../../core/ports/clock/clock.port.ts';
import { CampRepository } from '../../../../repositories/camps/camp/camp.repository.ts';
import { RegistrationFormRepository } from '../../../../repositories/camps/registration-form/registration-form.repository.ts';
import type { TurnusEntity } from '../../../../repositories/camps/turnus/turnus.entity.ts';
import { TurnusRepository } from '../../../../repositories/camps/turnus/turnus.repository.ts';
import {
  ParticipantExportRepository,
  type ExportPresetRow,
} from '../../../../repositories/registrations/participant-export/participant-export.repository.ts';
import type { ParticipantEntity } from '../../../../repositories/registrations/participant/participant.entity.ts';
import { PaymentRepository } from '../../../../repositories/registrations/payment/payment.repository.ts';
import type { RegistrationEntity } from '../../../../repositories/registrations/registration/registration.entity.ts';
import {
  RegistrationRepository,
  type GuardianFields,
} from '../../../../repositories/registrations/registration/registration.repository.ts';
import { LedgerService } from '../../ledger/services/ledger.service.ts';
import { exportParticipantsJob } from '../export-participants.job.ts';

type Cell = string | number | null;

// One Participant as a row of the export: the child, its Registration, guardians and money.
interface Row {
  readonly participant: ParticipantEntity;
  readonly registration: RegistrationEntity;
  readonly first: GuardianFields | undefined;
  readonly second: GuardianFields | undefined;
  readonly balance: Balance;
  readonly turnus: TurnusEntity;
}

const STATUS_HEADERS = { registered: 'Přihlášen', cancelled: 'Zrušen' } as const;
const PAYMENT_HEADERS = {
  unpaid: 'Nezaplaceno',
  deposit_paid: 'Záloha zaplacena',
  paid: 'Zaplaceno',
  overpaid: 'Přeplaceno',
} as const;
const SOURCE_HEADERS = { manual: 'Platba', gateway: 'Platba kartou', correction: 'Oprava' } as const;

const nameOf = (guardian: GuardianFields | undefined) =>
  guardian === undefined ? null : `${guardian.firstName} ${guardian.lastName}`;

// The export's own columns: the header the file shows and the cell of a row.
const FIXED: Readonly<Record<FixedExportColumn, { readonly header: string; readonly cell: (row: Row) => Cell }>> = {
  lastName: { header: 'Příjmení', cell: ({ participant }) => participant.lastName },
  firstName: { header: 'Jméno', cell: ({ participant }) => participant.firstName },
  birthDate: { header: 'Datum narození', cell: ({ participant }) => czechDate(participant.birthDate) },
  ageOnStart: {
    header: 'Věk v den začátku',
    cell: ({ participant, turnus }) => ageOnStart(participant.birthDate, turnus.startDate),
  },
  status: { header: 'Stav', cell: ({ participant }) => STATUS_HEADERS[participant.status] },
  variableSymbol: { header: 'Variabilní symbol', cell: ({ registration }) => registration.variableSymbol },
  submittedAt: { header: 'Odesláno', cell: ({ registration }) => czechDateTime(registration.submittedAt) },
  guardianName: { header: 'Zákonný zástupce', cell: ({ first }) => nameOf(first) },
  guardianEmail: { header: 'E-mail', cell: ({ first }) => first?.email ?? null },
  guardianPhone: { header: 'Telefon', cell: ({ first }) => first?.phone ?? null },
  secondGuardianName: { header: 'Druhý zákonný zástupce', cell: ({ second }) => nameOf(second) },
  secondGuardianEmail: { header: 'E-mail druhého zástupce', cell: ({ second }) => second?.email ?? null },
  secondGuardianPhone: { header: 'Telefon druhého zástupce', cell: ({ second }) => second?.phone ?? null },
  total: { header: 'Celkem', cell: ({ balance }) => balance.total },
  paid: { header: 'Zaplaceno', cell: ({ balance }) => balance.paid },
  balance: { header: 'Zbývá', cell: ({ balance }) => balance.balance },
  paymentStatus: { header: 'Stav platby', cell: ({ balance }) => PAYMENT_HEADERS[balance.status] },
  amountDueNow: { header: 'K úhradě nyní', cell: ({ balance }) => balance.amountDue.amount },
  dueDate: {
    header: 'Splatnost',
    cell: ({ balance }) => (balance.amountDue.dueDate === null ? null : czechDate(balance.amountDue.dueDate)),
  },
  overdue: { header: 'Po splatnosti', cell: ({ balance }) => (balance.overdue ? 'Ano' : 'Ne') },
};

// Where the form's columns sit among the export's own: after the guardians, before the money.
const FORM_AFTER: FixedExportColumn = 'secondGuardianPhone';

/**
 * Write an answer as a cell: options by their labels, yes or no in words, dates the Czech way.
 * @param value the answer
 */
function cellOf(value: AnswerValue | undefined): Cell {
  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value === 'boolean') {
    return value ? 'Ano' : 'Ne';
  }

  if (Array.isArray(value)) {
    return value.join(', ');
  }

  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) ? czechDate(value) : value;
}

/**
 * Show a preset as the app reads it.
 * @param preset the preset
 */
function presetOf({ id, name, columns }: ExportPresetRow): ExportPreset {
  return { id, name, columns };
}

// Excel exports, built by jobs and kept for the admin who started them: a Turnus's Participants with the
// columns chosen (every column the admin may see, the form's taken from all its published versions), with
// named presets shared per Camp and each admin's last choice remembered; and the Organisation's whole
// payment ledger for its accountant. No column is encrypted or health data yet. Permission (Registrations
// read) is the route's.
@Injectable()
export class ParticipantExportService {
  constructor(
    private readonly exports: ParticipantExportRepository,
    private readonly registrations: RegistrationRepository,
    private readonly payments: PaymentRepository,
    private readonly ledger: LedgerService,
    private readonly turnusy: TurnusRepository,
    private readonly camps: CampRepository,
    private readonly forms: RegistrationFormRepository,
    private readonly files: FileService,
    private readonly audit: AuditService,
    private readonly jobs: JobQueue,
    private readonly unitOfWork: UnitOfWork,
    private readonly clock: Clock,
  ) {}

  /**
   * Show what an export of a Turnus can hold: the form's columns, the Camp's presets and the admin's last
   * choice.
   * @param adminId the admin
   * @param turnusId Turnus id
   */
  public async options(adminId: string, turnusId: string): Promise<ExportOptions> {
    const turnus = await this.turnusy.getByIdOrThrow(turnusId);

    return {
      formColumns: (await this.formColumnsOf(turnus.campId)).map(({ key, label, labelKey, removed }) => ({
        id: `field:${key}`,
        label,
        labelKey,
        removed,
      })),
      presets: (await this.exports.listPresets(turnus.campId)).map(presetOf),
      lastSelection: await this.exports.getSelection(adminId, turnus.campId),
    };
  }

  /**
   * Start an export of a Turnus's Participants with the columns chosen, remembered as the admin's last
   * choice, audited; its job builds the file once this commits.
   * @param actor the admin
   * @param turnusId Turnus id
   * @param body the columns, or none for every column
   */
  public async start(actor: Actor, turnusId: string, body: StartParticipantExportBody): Promise<ParticipantExport> {
    if (actor.kind === 'system') {
      throw new Error('An admin starts an export, never the system');
    }

    const turnus = await this.turnusy.getByIdOrThrow(turnusId);
    const columns = body.columns ?? null;

    if (columns !== null) {
      await this.exports.saveSelection({
        adminId: actor.identity,
        campId: turnus.campId,
        columns,
        updatedAt: this.clock.now(),
      });
    }

    return this.begin(actor, turnus.id, columns);
  }

  /**
   * Start an export of the Organisation's whole payment ledger, audited.
   * @param actor the admin
   */
  public async startPayments(actor: Actor): Promise<ParticipantExport> {
    return this.begin(actor, null, null);
  }

  /**
   * Save a named preset of columns for a Camp, shared with the Organisation's admins, audited.
   * @param actor the admin
   * @param campId Camp id
   * @param body the name and columns
   */
  public async savePreset(actor: Actor, campId: string, body: SaveExportPresetBody): Promise<ExportPreset> {
    if (actor.kind === 'system') {
      throw new Error('An admin saves a preset, never the system');
    }

    await this.camps.getByIdOrThrow(campId);
    const preset = await this.exports.createPreset({
      campId,
      name: body.name,
      columns: body.columns,
      createdByAdminId: actor.identity,
      createdAt: this.clock.now(),
    });

    await this.audit.record(actor, {
      action: 'export_preset.create',
      target: { type: 'camp', id: campId },
      change: { before: null, after: preset },
    });

    return presetOf(preset);
  }

  /**
   * Remove an export preset, audited.
   * @param actor the admin
   * @param presetId preset id
   * @throws {NotFoundException} when the Organisation has no such preset
   */
  public async removePreset(actor: Actor, presetId: string): Promise<void> {
    const removed = await this.exports.removePreset(presetId);

    if (removed === null) {
      throw new NotFoundException();
    }

    await this.audit.record(actor, {
      action: 'export_preset.remove',
      target: { type: 'camp', id: removed.campId },
      change: { before: removed, after: null },
    });
  }

  /**
   * Get an export the admin started, with a download link once its file is ready.
   * @param adminId the admin
   * @param exportId export id
   * @throws {NotFoundException} when the admin started no such export
   */
  public async get(adminId: string, exportId: string): Promise<ParticipantExport> {
    const found = await this.exports.getById(exportId);

    if (found === null || found.adminId !== adminId) {
      throw new NotFoundException();
    }

    return {
      id: found.id,
      status: found.status,
      file: found.fileId === null ? null : await this.files.link(found.fileId),
    };
  }

  /**
   * Build an export's spreadsheet and store it encrypted.
   * @param exportId export id
   */
  public async build(exportId: string): Promise<void> {
    const found = await this.exports.getByIdForUpdate(exportId);

    if (found === null || found.status === 'ready') {
      return;
    }

    if (found.turnusId === null) {
      await this.complete(exportId, 'platby.xlsx', 'Platby', await this.paymentsSheet());

      return;
    }

    // A Turnus removed meanwhile leaves nothing to export; retrying would not bring it back.
    const turnus = await this.turnusy.getById(found.turnusId);

    if (turnus !== null) {
      await this.complete(
        exportId,
        `ucastnici-${turnus.startDate}.xlsx`,
        'Účastníci',
        await this.participantsSheet(turnus, found.columns),
      );
    }
  }

  /**
   * Record an export, or give back the admin's same one still waiting, audited; its job builds the file.
   * @param actor the admin
   * @param turnusId the Turnus of a Participant export, or null for the payments export
   * @param columns the columns chosen, or null for every column
   */
  private async begin(actor: Actor, turnusId: string | null, columns: string[] | null): Promise<ParticipantExport> {
    if (actor.kind === 'system') {
      throw new Error('An admin starts an export, never the system');
    }

    // A repeated click waits for the export already being made instead of building the same file again.
    const pending = await this.exports.getPending(actor.identity, turnusId);

    if (pending !== null) {
      return { id: pending.id, status: 'pending', file: null };
    }

    const started = await this.exports.create({
      adminId: actor.identity,
      kind: turnusId === null ? 'payments' : 'participants',
      turnusId,
      columns,
      createdAt: this.clock.now(),
    });

    await this.audit.record(actor, {
      action: 'export.create',
      target:
        turnusId === null
          ? { type: 'organisation', id: this.unitOfWork.organisationId }
          : { type: 'turnus', id: turnusId },
      change: { before: null, after: { kind: started.kind, columns } },
    });
    this.jobs.enqueue(exportParticipantsJob, { exportId: started.id });

    return { id: started.id, status: 'pending', file: null };
  }

  /**
   * List a Camp's form columns beyond the core, from all its published versions.
   * @param campId Camp id
   */
  private async formColumnsOf(campId: string): Promise<FormColumn[]> {
    const published = (await this.forms.listPublished(campId)).map(({ definition }) => definition);

    return columnCatalogue(published, REGISTRATION_FIELD_CATALOGUE).filter(({ tier }) => tier !== 'core');
  }

  /**
   * Lay out a Turnus's Participants, by surname, in the columns chosen, kept in the export's own order.
   * @param turnus the Turnus
   * @param chosen the columns chosen, or null for every column
   */
  private async participantsSheet(
    turnus: TurnusEntity,
    chosen: readonly string[] | null,
  ): Promise<{ headers: string[]; rows: Cell[][] }> {
    const published = (await this.forms.listPublished(turnus.campId)).map(({ definition }) => definition);
    // A custom field as its newest version asks it, for the labels of its options.
    const fields = new Map(published.flatMap(({ custom }: FormDefinition) => custom.map((field) => [field.id, field])));
    const formColumns = await this.formColumnsOf(turnus.campId);
    const wanted = (id: string) => chosen === null || chosen.includes(id);
    const answerCell = (key: string, answers: Answers) => {
      const value = answers[key];
      const field = fields.get(key);

      return cellOf(
        field === undefined || value === undefined || value === null ? value : withOptionLabels(field, value),
      );
    };
    const formEntries = formColumns
      .filter(({ key }) => wanted(`field:${key}`))
      .map(({ key, scope, label, removed }) => ({
        header: `${label ?? key}${removed ? ' (odstraněno)' : ''}`,
        cell: (row: Row) =>
          answerCell(key, scope === 'registration' ? row.registration.answers : row.participant.answers),
      }));
    const columns = FIXED_EXPORT_COLUMNS.flatMap((id) => [
      ...(wanted(id) ? [FIXED[id]] : []),
      ...(id === FORM_AFTER ? formEntries : []),
    ]);
    const registrations = await this.registrations.listByTurnus(turnus.id);
    const registrationOf = new Map(registrations.map((registration) => [registration.id, registration]));
    const ids = registrations.map(({ id }) => id);
    const participants = (await this.registrations.listParticipantsOf(ids)).toSorted(
      (one, other) =>
        one.lastName.localeCompare(other.lastName, 'cs') || one.firstName.localeCompare(other.firstName, 'cs'),
    );
    const guardians = await this.registrations.listGuardiansOf(ids);
    const balances = await this.ledger.balancesOf(turnus, registrations);

    return {
      headers: columns.map(({ header }) => header),
      rows: participants.flatMap((participant) => {
        const registration = registrationOf.get(participant.registrationId);
        const balance = registration === undefined ? undefined : balances.get(registration.id);

        if (registration === undefined || balance === undefined) {
          return [];
        }

        const [first, second] = guardians.get(registration.id) ?? [];
        const row: Row = { participant, registration, first, second, balance, turnus };

        return [columns.map(({ cell }) => cell(row))];
      }),
    };
  }

  /**
   * Lay out the Organisation's whole payment ledger, oldest payment first.
   */
  private async paymentsSheet(): Promise<{ headers: string[]; rows: Cell[][] }> {
    return {
      headers: ['Variabilní symbol', 'Datum', 'Částka', 'Druh', 'Poznámka', 'Transakce platební brány', 'Zapsáno'],
      rows: (await this.payments.listAllWithVariableSymbol()).map((payment) => [
        payment.variableSymbol,
        czechDate(payment.paidOn),
        payment.amount,
        SOURCE_HEADERS[payment.source],
        payment.note,
        payment.gatewayTransactionId,
        czechDateTime(payment.recordedAt.toISOString()),
      ]),
    };
  }

  /**
   * Store an export's spreadsheet encrypted and mark the export ready.
   * @param exportId export id
   * @param name the file's name
   * @param sheetName the sheet's name
   * @param sheet its headers and rows
   */
  private async complete(
    exportId: string,
    name: string,
    sheetName: string,
    sheet: { headers: string[]; rows: Cell[][] },
  ): Promise<void> {
    const fileId = await this.files.store(
      { name, bytes: await spreadsheetOf(sheetName, sheet.headers, sheet.rows) },
      { allow: [XLSX_CONTENT_TYPE] },
    );

    await this.exports.complete(exportId, fileId);
  }
}

/**
 * Write a spreadsheet with a bold, frozen and filterable header row.
 * @param name the sheet's name
 * @param headers the column headers
 * @param rows the rows, a cell per header
 */
async function spreadsheetOf(name: string, headers: readonly string[], rows: readonly Cell[][]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(name, { views: [{ state: 'frozen', ySplit: 1 }] });

  sheet.addRow([...headers]).font = { bold: true };

  for (const row of rows) {
    sheet.addRow([...row]);
  }

  sheet.columns.forEach((column, index) => {
    column.width = Math.min(Math.max((headers[index] ?? '').length + 4, 12), 40);
  });
  sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: headers.length } };

  return Buffer.from(await workbook.xlsx.writeBuffer());
}
