import { sql } from 'drizzle-orm';
import * as p from 'drizzle-orm/pg-core';

import type { Answers } from '@repo/schema/form-engine';
import { PARTICIPANT_STATUSES } from '@repo/schema/registrations';

import { encrypted } from '../helpers/encrypted.ts';
import { id } from '../helpers/ids.ts';
import { organisationId, organisationPolicy } from '../helpers/organisation.ts';
import { registrations } from './registrations.ts';

export const participantStatus = p.pgEnum('participant_status', PARTICIPANT_STATUSES);

export const participants = p.snakeCase.table.withRLS(
  'participants',
  {
    id: id(),
    organisationId: organisationId(),
    registrationId: p.uuid().notNull(),
    position: p.integer().notNull(),
    firstName: p.text().notNull(),
    lastName: p.text().notNull(),
    // Null only once the Registration is erased.
    birthDate: p.date({ mode: 'string' }),
    status: participantStatus().notNull().default('registered'),
    answers: p.jsonb().$type<Answers>().notNull().default({}),
    // The encrypted and health answers, as one encrypted JSON object; null when there are none.
    encryptedAnswers: encrypted(),
    // No foreign key to files, as for logos: the Přihláška is replaced or removed through the Participant.
    prihlaskaFileId: p.uuid(),
  },
  (table) => [
    p.unique('participants_organisation_id_id_key').on(table.organisationId, table.id),
    p.unique('participants_registration_id_position_key').on(table.registrationId, table.position),
    p
      .foreignKey({
        name: 'participants_registrations_fkey',
        columns: [table.organisationId, table.registrationId],
        foreignColumns: [registrations.organisationId, registrations.id],
      })
      .onDelete('cascade'),
    p.check('participants_position', sql`${table.position} >= 0`),
    organisationPolicy(),
  ],
);
