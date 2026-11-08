import { useState } from 'react';

import {
  consentContentSchema,
  type ConsentItem,
  type ConsentItemKind,
  type ConsentVersion,
  type StarterConsent,
} from '@repo/schema/consents';
import type { FileLink } from '@repo/schema/files';

import { useSaveConsentMutation, useUploadConsentFileMutation } from '@/features/camps/api/camps.queries';
import { uuidv7 } from '@/lib/utils';

// What the editor holds: the content, its PDF with a link to read it.
export interface ConsentDraft {
  readonly title: string;
  readonly introduction: string;
  readonly items: readonly ConsentItem[];
  readonly withdrawable: boolean;
  readonly file: { readonly id: string; readonly link: FileLink } | null;
}

/**
 * Start the editor from a published version, or empty for a new Consent.
 * @param version the newest version, or null
 */
export function draftOf(version: ConsentVersion | null): ConsentDraft {
  return version === null
    ? {
        title: '',
        introduction: '',
        items: [{ id: uuidv7(), kind: 'must_agree', text: '' }],
        withdrawable: false,
        file: null,
      }
    : {
        title: version.title,
        introduction: version.introduction,
        items: version.items,
        withdrawable: version.withdrawable,
        file: version.file === null ? null : { id: version.file.id, link: version.file.link },
      };
}

/**
 * Start a new Consent from a starter: its text with fresh item ids, unsaved until the admin publishes it.
 * @param starter one of STARTER_CONSENTS
 */
export function draftOfStarter(starter: StarterConsent): ConsentDraft {
  return {
    title: starter.title,
    introduction: starter.introduction,
    items: starter.items.map((item) => ({ id: uuidv7(), ...item })),
    withdrawable: starter.withdrawable,
    file: null,
  };
}

/**
 * Bring the editor into view when it opens: on a phone it sits under the list. Left alone when visible.
 * Defined once, so React calls it only when the editor mounts.
 * @param node the editor, or null when it unmounts
 */
function revealOnMount(node: HTMLElement | null) {
  node?.scrollIntoView({ block: 'nearest' });
}

// Writing a Consent: each save publishes it as a new version, the earlier ones staying as signed.
export function useConsentEditor(
  organisationId: string,
  campId: string,
  consentId: string | null,
  initial: ConsentDraft,
  onSaved: (consentId: string) => void,
) {
  const [draft, setDraft] = useState(initial);
  const save = useSaveConsentMutation(organisationId, campId);
  const upload = useUploadConsentFileMutation(organisationId, campId);
  const content = consentContentSchema.safeParse({
    title: draft.title,
    introduction: draft.introduction,
    items: draft.items,
    withdrawable: draft.withdrawable,
    fileId: draft.file?.id ?? null,
  });
  const setItem = (index: number, item: ConsentItem) =>
    setDraft({ ...draft, items: draft.items.map((current, at) => (at === index ? item : current)) });

  return {
    draft,
    setTitle: (title: string) => setDraft({ ...draft, title }),
    setIntroduction: (introduction: string) => setDraft({ ...draft, introduction }),
    setWithdrawable: (withdrawable: boolean) => setDraft({ ...draft, withdrawable }),
    setItemText: (index: number, item: ConsentItem, text: string) => setItem(index, { ...item, text }),
    setItemKind: (index: number, item: ConsentItem, kind: ConsentItemKind) => setItem(index, { ...item, kind }),
    addItem: () => setDraft({ ...draft, items: [...draft.items, { id: uuidv7(), kind: 'yes_no', text: '' }] }),
    removeItem: (index: number) => setDraft({ ...draft, items: draft.items.filter((_, at) => at !== index) }),
    attach: (file: File) =>
      upload.mutate(file, {
        onSuccess: ({ fileId, link }) => setDraft((current) => ({ ...current, file: { id: fileId, link } })),
      }),
    detach: () => setDraft({ ...draft, file: null }),
    isUploading: upload.isPending,
    uploadFailed: upload.isError,
    canSave: content.success && !save.isPending && !upload.isPending,
    save: () => {
      if (content.success) {
        save.mutate({ consentId, content: content.data }, { onSuccess: (consent) => onSaved(consent.id) });
      }
    },
    saveFailed: save.isError,
    saved: save.isSuccess,
    revealRef: revealOnMount,
  };
}
