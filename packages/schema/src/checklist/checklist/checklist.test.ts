import { describe, expect, it } from 'vitest';

import { checklistOf, type ChecklistInput } from './checklist.ts';

const CONSENT = '0190a2b4-0000-7000-8000-0000000000f1';
const REQUIREMENT = '0190a2b4-0000-7000-8000-0000000000f2';

const INPUT: ChecklistInput = {
  participantStatus: 'registered',
  modules: { consents: true, documents: true, healthRecord: true },
  payment: { amountDue: 2000, dueDate: '2027-04-24' },
  missingAnswers: 0,
  consents: [{ consentId: CONSENT, title: 'Souhlas s fotografováním', state: 'unsigned' }],
  healthRecord: null,
  requirements: [{ documentTypeId: REQUIREMENT, name: 'Potvrzení od lékaře', dueDate: null, state: 'missing' }],
};

const summary = (input: ChecklistInput) =>
  checklistOf(input)?.map(({ kind, state, done }) => `${kind}:${state}:${done ? 'done' : 'open'}`);

describe('checklistOf', () => {
  it('lists payment, each Consent and each requirement, open until done', () => {
    expect(summary(INPUT)).toEqual(['payment:open:open', 'consent:unsigned:open', 'document:missing:open']);
    expect(checklistOf(INPUT)?.[0]).toMatchObject({ dueDate: '2027-04-24' });
  });

  it('counts payment done once nothing is due now', () => {
    expect(summary({ ...INPUT, payment: { amountDue: 0, dueDate: null } })?.[0]).toBe('payment:done:done');
  });

  it('adds one item for answers owed to fields added later', () => {
    expect(checklistOf({ ...INPUT, missingAnswers: 2 })).toContainEqual(
      expect.objectContaining({ kind: 'missing_answers', count: 2, done: false }),
    );
  });

  it('counts a signed or Withdrawn Consent done', () => {
    for (const state of ['signed', 'withdrawn'] as const) {
      expect(summary({ ...INPUT, consents: [{ consentId: CONSENT, title: 'Souhlas', state }] })?.[1]).toBe(
        `consent:${state}:done`,
      );
    }
  });

  it('counts a requirement done when approved, on paper or Cleared, and open when Returned or pending', () => {
    const stateOf = (state: ChecklistInput['requirements'][number]['state']) =>
      summary({
        ...INPUT,
        requirements: [{ documentTypeId: REQUIREMENT, name: 'Potvrzení', dueDate: null, state }],
      })?.[2];

    expect(stateOf('approved')).toBe('document:approved:done');
    expect(stateOf('cleared')).toBe('document:cleared:done');
    expect(stateOf('returned')).toBe('document:returned:open');
    expect(stateOf('pending')).toBe('document:pending:open');
  });

  it('reports the Health record once it exists', () => {
    expect(summary({ ...INPUT, healthRecord: { complete: false } })).toContain('health_record:open:open');
  });

  it('leaves out the modules switched off', () => {
    expect(
      summary({
        ...INPUT,
        healthRecord: { complete: true },
        modules: { consents: false, documents: false, healthRecord: false },
      }),
    ).toEqual(['payment:open:open']);
  });

  it('gives a Cancelled child no checklist', () => {
    expect(checklistOf({ ...INPUT, participantStatus: 'cancelled' })).toBeNull();
  });
});
