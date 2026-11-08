import { useState } from 'react';

import type { StarterConsent } from '@repo/schema/consents';

import { useConsentQuery, useConsentsQuery } from '@/features/camps/api/camps.queries';
import { draftOf, draftOfStarter } from '@/features/camps/components/consents-section/use-consent-editor.hook';

// Which Consent is open, and what a new one starts from: a starter or a blank page.
export function useConsentsSection(organisationId: string, campId: string) {
  const consents = useConsentsQuery(organisationId, campId);
  // null: a new Consent; undefined: none opened.
  const [openId, setOpenId] = useState<string | null | undefined>(undefined);
  const [starter, setStarter] = useState<StarterConsent | null>(null);
  const opened = useConsentQuery(organisationId, campId, openId ?? null);
  const [newest] = opened.data?.versions ?? [];

  return {
    consents,
    openId,
    open: setOpenId,
    startNew: (from: StarterConsent | null) => {
      setStarter(from);
      setOpenId(null);
    },
    newKey: `new-${starter?.key ?? 'blank'}`,
    newDraft: () => (starter === null ? draftOf(null) : draftOfStarter(starter)),
    opened,
    newest,
    // The version the next save publishes.
    nextVersion: (newest?.version ?? 0) + 1,
    hasNone: consents.data?.length === 0,
  };
}
