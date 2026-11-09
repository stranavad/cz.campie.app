import { useState } from 'react';

import type { GuardianEdit } from '@repo/schema/portal';

import {
  useAnswerNewFieldsMutation,
  useRequestEmailChangeMutation,
  useUpdateGuardianContactMutation,
} from '@/features/portal/api/portal.queries';
import { editFailureOf, type EditFailure } from '@/features/portal/components/edit/edit-failure';
import { useNewFields } from '@/features/portal/components/edit/use-new-fields.hook';

type Guardian = GuardianEdit['guardians'][number];

export interface GuardianDraft {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
}

// Where a failed save shows: at a guardian's contact, at their email, or at the new questions.
type FailureAt = `contact-${number}` | `email-${number}` | 'fields';

// A guardian as stored: the email waiting for confirmation counts as the one asked for.
const draftOf = (guardian: Guardian): GuardianDraft => ({
  firstName: guardian.firstName,
  lastName: guardian.lastName,
  phone: guardian.phone ?? '',
  email: guardian.pendingEmail ?? guardian.email,
});

/**
 * Everything a guardian changes on a Registration, saved by one button: each guardian's name and phone, a
 * new email (only after its confirmation), and the answers to new questions. Only what changed is sent, each
 * part by its own request, so one refused part names its place and the rest still saves.
 * @param registrationId the guardian's Registration
 * @param edit what the guardian may change on it
 */
export function useEditForm(registrationId: string, edit: GuardianEdit) {
  const contact = useUpdateGuardianContactMutation(registrationId);
  const emailChange = useRequestEmailChangeMutation(registrationId);
  const answers = useAnswerNewFieldsMutation(registrationId);
  const fields = useNewFields(edit);
  // Only guardians the page touched; one added meanwhile starts from what is stored.
  const [drafts, setDrafts] = useState<Partial<Record<number, GuardianDraft>>>({});
  const [failures, setFailures] = useState<Partial<Record<FailureAt, EditFailure>>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const guardians = edit.guardians.map((guardian) => {
    const stored = draftOf(guardian);
    const draft = drafts[guardian.position] ?? stored;

    return {
      guardian,
      draft,
      contactChanged:
        draft.firstName !== stored.firstName || draft.lastName !== stored.lastName || draft.phone !== stored.phone,
      emailChanged: draft.email.trim() !== stored.email,
    };
  });
  const hasChanges = fields.hasChanges || guardians.some((entry) => entry.contactChanged || entry.emailChanged);

  const attempt = async (at: FailureAt, run: () => Promise<unknown>) => {
    try {
      await run();

      return null;
    } catch (error) {
      return [at, editFailureOf(error instanceof Error ? error : null) ?? 'unexpected'] as const;
    }
  };

  return {
    // Answering a new question clears the last save's confirmation, as typing does.
    fields: {
      ...fields,
      answerRegistration: (...args: Parameters<typeof fields.answerRegistration>) => {
        setIsSaved(false);
        fields.answerRegistration(...args);
      },
      answerParticipant: (...args: Parameters<typeof fields.answerParticipant>) => {
        setIsSaved(false);
        fields.answerParticipant(...args);
      },
    },
    guardians,
    failureAt: (at: FailureAt) => failures[at] ?? null,
    hasChanges,
    isSaving,
    isSaved,
    hasFailed: Object.keys(failures).length > 0,
    change: (position: number, draft: GuardianDraft) => {
      setIsSaved(false);
      setDrafts({ ...drafts, [position]: draft });
    },
    save: async () => {
      setIsSaving(true);
      setIsSaved(false);

      const results = await Promise.all([
        ...guardians.flatMap(({ guardian: { position }, draft, contactChanged, emailChanged }) => [
          contactChanged
            ? attempt(`contact-${position}`, () =>
                contact.mutateAsync({
                  position,
                  body: {
                    firstName: draft.firstName,
                    lastName: draft.lastName,
                    phone: draft.phone === '' ? null : draft.phone,
                  },
                }),
              )
            : null,
          emailChanged
            ? attempt(`email-${position}`, () => emailChange.mutateAsync({ position, email: draft.email.trim() }))
            : null,
        ]),
        fields.hasChanges ? attempt('fields', () => answers.mutateAsync(fields.changes)) : null,
      ]);
      const failed = Object.fromEntries(results.filter((result) => result !== null));

      setFailures(failed);
      setIsSaved(Object.keys(failed).length === 0);
      setIsSaving(false);
    },
  };
}
