import { z } from 'zod';

import type { ConsentState } from '@repo/schema/consents';
import { UPLOAD_STATUSES } from '@repo/schema/documents';
import type { ParticipantStatus } from '@repo/schema/registrations';

// What a child's checklist is made of, each module reporting its own items.
export const CHECKLIST_ITEM_KINDS = ['payment', 'missing_answers', 'consent', 'health_record', 'document'] as const;

export type ChecklistItemKind = (typeof CHECKLIST_ITEM_KINDS)[number];

// A requirement's state for a child: nothing handed in, its newest document's review, or Cleared by the
// Turnus cleanup, which counts as done.
export const REQUIREMENT_STATES = ['missing', ...UPLOAD_STATUSES, 'cleared'] as const;

export type RequirementState = (typeof REQUIREMENT_STATES)[number];

export const checklistItemSchema = z.object({
  kind: z.enum(CHECKLIST_ITEM_KINDS),
  // The Consent's or requirement's id; null for the items a child has one of.
  key: z.uuid().nullable(),
  // The Consent's title or the requirement's name; null for the platform's own wording of the kind.
  label: z.string().nullable(),
  // The item's own state: a Consent's, a requirement's, or `open`/`done`.
  state: z.string(),
  done: z.boolean(),
  dueDate: z.iso.date().nullable(),
  // Missing answers only: how many.
  count: z.number().int().nullable(),
});

export type ChecklistItem = z.infer<typeof checklistItemSchema>;

export interface ChecklistInput {
  readonly participantStatus: ParticipantStatus;
  // The Camp's modules that report items; a module switched off reports none.
  readonly modules: { readonly consents: boolean; readonly documents: boolean; readonly healthRecord: boolean };
  // The Registration's amount due now and its due date.
  readonly payment: { readonly amountDue: number; readonly dueDate: string | null };
  // Required answers the child still owes to fields added in later versions of the form.
  readonly missingAnswers: number;
  readonly consents: readonly { readonly consentId: string; readonly title: string; readonly state: ConsentState }[];
  // Whether the Health record is complete; null until the Health record exists (stage 2).
  readonly healthRecord: { readonly complete: boolean } | null;
  readonly requirements: readonly {
    readonly documentTypeId: string;
    readonly name: string;
    readonly dueDate: string | null;
    readonly state: RequirementState;
  }[];
}

const item = (fields: Partial<ChecklistItem> & Pick<ChecklistItem, 'kind' | 'state' | 'done'>): ChecklistItem => ({
  key: null,
  label: null,
  dueDate: null,
  count: null,
  ...fields,
});

/**
 * Gather a child's checklist from what each module reports: payment, missing answers, each Consent, the
 * Health record and each document requirement. A Withdrawn Consent is the guardians' answer, so it counts
 * as done; a document waiting for review is not done but asks nothing of them.
 * @param input what each module reports for the child
 * @returns the items, or null for a Cancelled child, who has no checklist
 */
export function checklistOf(input: ChecklistInput): ChecklistItem[] | null {
  if (input.participantStatus === 'cancelled') {
    return null;
  }

  const paid = input.payment.amountDue <= 0;
  const items: ChecklistItem[] = [
    item({
      kind: 'payment',
      state: paid ? 'done' : 'open',
      done: paid,
      dueDate: paid ? null : input.payment.dueDate,
    }),
  ];

  if (input.missingAnswers > 0) {
    items.push(item({ kind: 'missing_answers', state: 'open', done: false, count: input.missingAnswers }));
  }

  if (input.modules.consents) {
    items.push(
      ...input.consents.map(({ consentId, title, state }) =>
        item({ kind: 'consent', key: consentId, label: title, state, done: state !== 'unsigned' }),
      ),
    );
  }

  if (input.modules.healthRecord && input.healthRecord !== null) {
    const { complete } = input.healthRecord;

    items.push(item({ kind: 'health_record', state: complete ? 'done' : 'open', done: complete }));
  }

  if (input.modules.documents) {
    items.push(
      ...input.requirements.map(({ documentTypeId, name, dueDate, state }) =>
        item({
          kind: 'document',
          key: documentTypeId,
          label: name,
          state,
          done: state === 'approved' || state === 'cleared',
          dueDate,
        }),
      ),
    );
  }

  return items;
}

/**
 * Tell whether an item asks something of the guardians other than money: open, and not a document waiting
 * for the camp's review. Payment is reminded on its own.
 * @param item the checklist item
 */
export function isOpenForGuardians(item: ChecklistItem): boolean {
  return !item.done && item.kind !== 'payment' && !(item.kind === 'document' && item.state === 'pending');
}
