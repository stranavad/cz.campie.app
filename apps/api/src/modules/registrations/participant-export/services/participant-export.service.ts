import { Injectable, NotFoundException } from '@nestjs/common';
import ExcelJS from 'exceljs';

import { ageOnStart, REGISTRATION_FIELD_CATALOGUE } from '@repo/schema/camps';
import { XLSX_CONTENT_TYPE } from '@repo/schema/files';
import {
  columnCatalogue,
  withOptionLabels,
  type Answers,
  type AnswerValue,
  type FormDefinition,
} from '@repo/schema/form-engine';
import { balanceOf } from '@repo/schema/pricing';
import type { ParticipantExport } from '@repo/schema/registrations';
import { czechDate, czechDateTime, pragueDateOf } from '@repo/schema/shared';

import type { Actor } from '../../../../core/audit/actor.ts';
import { AuditService } from '../../../../core/audit/audit.service.ts';
import { FileService } from '../../../../core/files/file.service.ts';
import { JobQueue } from '../../../../core/jobs/job-queue.ts';
import { Clock } from '../../../../core/ports/clock/clock.port.ts';
import { RegistrationFormRepository } from '../../../../repositories/camps/registration-form/registration-form.repository.ts';
import { TurnusRepository } from '../../../../repositories/camps/turnus/turnus.repository.ts';
import { ParticipantExportRepository } from '../../../../repositories/registrations/participant-export/participant-export.repository.ts';
import { PaymentRepository } from '../../../../repositories/registrations/payment/payment.repository.ts';
import { PriceAdjustmentRepository } from '../../../../repositories/registrations/price-adjustment/price-adjustment.repository.ts';
import { RegistrationRepository } from '../../../../repositories/registrations/registration/registration.repository.ts';
import { exportParticipantsJob } from '../export-participants.job.ts';

type Cell = string | number | null;

const STATUS_HEADERS = { registered: 'Přihlášen', cancelled: 'Zrušen' } as const;
const PAYMENT_HEADERS = {
  unpaid: 'Nezaplaceno',
  deposit_paid: 'Záloha zaplacena',
  paid: 'Zaplaceno',
  overpaid: 'Přeplaceno',
} as const;

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

// The first, fixed export: an Excel file of a Turnus's Participants with every column the admin may see,
// the form's columns taken from all its published versions. Built by a job; nothing is encrypted or health
// data among its columns yet. Permission (Registrations read) is the route's.
@Injectable()
export class ParticipantExportService {
  constructor(
    private readonly exports: ParticipantExportRepository,
    private readonly registrations: RegistrationRepository,
    private readonly payments: PaymentRepository,
    private readonly adjustments: PriceAdjustmentRepository,
    private readonly turnusy: TurnusRepository,
    private readonly forms: RegistrationFormRepository,
    private readonly files: FileService,
    private readonly audit: AuditService,
    private readonly jobs: JobQueue,
    private readonly clock: Clock,
  ) {}

  /**
   * Start an export of a Turnus's Participants, audited; its job builds the file once this commits.
   * @param actor the admin
   * @param turnusId Turnus id
   */
  public async start(actor: Actor, turnusId: string): Promise<ParticipantExport> {
    if (actor.kind === 'system') {
      throw new Error('An admin starts an export, never the system');
    }

    await this.turnusy.getByIdOrThrow(turnusId);
    // A repeated click waits for the export already being made instead of building the same file again.
    const pending = await this.exports.getPending(actor.identity, turnusId);

    if (pending !== null) {
      return { id: pending.id, status: 'pending', file: null };
    }

    const started = await this.exports.create({ adminId: actor.identity, turnusId, createdAt: this.clock.now() });

    await this.audit.record(actor, { action: 'export.create', target: { type: 'turnus', id: turnusId } });
    this.jobs.enqueue(exportParticipantsJob, { exportId: started.id });

    return { id: started.id, status: 'pending', file: null };
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
    // A Turnus removed meanwhile leaves nothing to export; retrying would not bring it back.
    const turnus = found === null || found.status === 'ready' ? null : await this.turnusy.getById(found.turnusId);

    if (turnus === null) {
      return;
    }

    const published = (await this.forms.listPublished(turnus.campId)).map(({ definition }) => definition);
    const columns = columnCatalogue(published, REGISTRATION_FIELD_CATALOGUE).filter(({ tier }) => tier !== 'core');
    // A custom field as its newest version asks it, for the labels of its options.
    const fields = new Map(published.flatMap(({ custom }: FormDefinition) => custom.map((field) => [field.id, field])));
    const registrations = await this.registrations.listByTurnus(turnus.id);
    const registrationOf = new Map(registrations.map((registration) => [registration.id, registration]));
    const ids = registrations.map(({ id }) => id);
    const participants = await this.registrations.listParticipantsOf(ids);
    const guardians = await this.registrations.listGuardiansOf(ids);
    const lines = await this.registrations.sumPriceLinesOf(ids);
    const paid = await this.payments.sumOf(ids);
    const adjusted = await this.adjustments.sumOf(ids);
    const today = pragueDateOf(this.clock.now());
    const answerCell = (key: string, answers: Answers) => {
      const value = answers[key];
      const field = fields.get(key);

      return cellOf(
        field === undefined || value === undefined || value === null ? value : withOptionLabels(field, value),
      );
    };

    const headers = [
      'Příjmení',
      'Jméno',
      'Datum narození',
      'Věk v den začátku',
      'Stav',
      'Variabilní symbol',
      'Odesláno',
      'Zákonný zástupce',
      'E-mail',
      'Telefon',
      'Druhý zákonný zástupce',
      'E-mail druhého zástupce',
      'Telefon druhého zástupce',
      ...columns.map(({ label, key, removed }) => `${label ?? key}${removed ? ' (odstraněno)' : ''}`),
      'Celkem',
      'Zaplaceno',
      'Zbývá',
      'Stav platby',
      'K úhradě nyní',
      'Splatnost',
      'Po splatnosti',
    ];
    const rows: Cell[][] = participants
      .flatMap((participant) => {
        const registration = registrationOf.get(participant.registrationId);

        if (registration === undefined) {
          return [];
        }

        const [first, second] = guardians.get(registration.id) ?? [];
        const balance = balanceOf(
          {
            lines: [{ amount: lines.get(registration.id) ?? 0 }],
            adjustments: [{ amount: adjusted.get(registration.id) ?? 0 }],
            payments: [{ amount: paid.get(registration.id) ?? 0 }],
            depositTotal: registration.depositTotal,
            submittedAt: registration.submittedAt,
            depositDueDays: turnus.depositDueDays,
            balanceDueDate: turnus.balanceDueDate,
          },
          today,
        );

        return [
          [
            participant.lastName,
            participant.firstName,
            czechDate(participant.birthDate),
            ageOnStart(participant.birthDate, turnus.startDate),
            STATUS_HEADERS[participant.status],
            registration.variableSymbol,
            czechDateTime(registration.submittedAt),
            first === undefined ? null : `${first.firstName} ${first.lastName}`,
            first?.email ?? null,
            first?.phone ?? null,
            second === undefined ? null : `${second.firstName} ${second.lastName}`,
            second?.email ?? null,
            second?.phone ?? null,
            ...columns.map(({ key, scope }) =>
              answerCell(key, scope === 'registration' ? registration.answers : participant.answers),
            ),
            balance.total,
            balance.paid,
            balance.balance,
            PAYMENT_HEADERS[balance.status],
            balance.amountDue.amount,
            balance.amountDue.dueDate === null ? null : czechDate(balance.amountDue.dueDate),
            balance.overdue ? 'Ano' : 'Ne',
          ],
        ];
      })
      .sort(
        ([oneLast, oneFirst], [otherLast, otherFirst]) =>
          String(oneLast).localeCompare(String(otherLast), 'cs') ||
          String(oneFirst).localeCompare(String(otherFirst), 'cs'),
      );

    const fileId = await this.files.store(
      { name: `ucastnici-${turnus.startDate}.xlsx`, bytes: await spreadsheetOf(headers, rows) },
      { allow: [XLSX_CONTENT_TYPE] },
    );

    await this.exports.complete(exportId, fileId);
  }
}

/**
 * Write a spreadsheet with a bold, frozen and filterable header row.
 * @param headers the column headers
 * @param rows the rows, a cell per header
 */
async function spreadsheetOf(headers: readonly string[], rows: readonly Cell[][]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Účastníci', { views: [{ state: 'frozen', ySplit: 1 }] });

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
