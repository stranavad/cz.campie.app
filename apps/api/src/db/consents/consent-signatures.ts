import * as p from 'drizzle-orm/pg-core';

import { id } from '../helpers/ids.ts';
import { organisationId, organisationPolicy } from '../helpers/organisation.ts';
import { participants } from '../registrations/participants.ts';
import { consentVersions } from './consent-versions.ts';
import { consents } from './consents.ts';

// A guardian's signature of a Consent version for a Participant, with its evidence. Never changed once
// made, but for the signed PDF it gains; a later signature supersedes it and both stay.
export const consentSignatures = p.snakeCase.table.withRLS(
  'consent_signatures',
  {
    id: id(),
    organisationId: organisationId(),
    participantId: p.uuid().notNull(),
    consentId: p.uuid().notNull(),
    consentVersionId: p.uuid().notNull(),
    answers: p.jsonb().$type<Record<string, boolean>>().notNull(),
    signerName: p.text().notNull(),
    signerPlace: p.text().notNull(),
    // The verified email of the guardian session that signed.
    signerEmail: p.text().notNull(),
    ipAddress: p.text().notNull(),
    userAgent: p.text().notNull(),
    signedAt: p.timestamp({ withTimezone: true }).notNull(),
    fileId: p.uuid(),
  },
  (table) => [
    p
      .foreignKey({
        name: 'consent_signatures_participants_fkey',
        columns: [table.organisationId, table.participantId],
        foreignColumns: [participants.organisationId, participants.id],
      })
      .onDelete('cascade'),
    p
      .foreignKey({
        name: 'consent_signatures_consents_fkey',
        columns: [table.organisationId, table.consentId],
        foreignColumns: [consents.organisationId, consents.id],
      })
      .onDelete('cascade'),
    p
      .foreignKey({
        name: 'consent_signatures_consent_versions_fkey',
        columns: [table.organisationId, table.consentVersionId],
        foreignColumns: [consentVersions.organisationId, consentVersions.id],
      })
      .onDelete('cascade'),
    p.index('consent_signatures_participant_id_idx').on(table.participantId, table.consentId, table.signedAt),
    organisationPolicy(),
  ],
);
