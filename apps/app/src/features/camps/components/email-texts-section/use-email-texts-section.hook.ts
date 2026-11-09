import { useRef, useState } from 'react';

import type { EmailType } from '@repo/schema/emails';

import { useCampQuery, useEmailTextsQuery } from '@/features/camps/api/camps.queries';

// The Camp's emails and the one opened to edit, the first until another is picked, and the Camp for its
// team's addresses.
export function useEmailTextsSection(organisationId: string, campId: string) {
  const emails = useEmailTextsQuery(organisationId, campId);
  const camp = useCampQuery(organisationId, campId);
  const [openedType, setOpenedType] = useState<EmailType | null>(null);
  // The editor sits under the list on a phone, so opening an email brings it into view.
  const editorRef = useRef<HTMLElement>(null);
  const list = emails.data ?? [];

  return {
    emails,
    camp: camp.data,
    opened: list.find((email) => email.type === openedType) ?? list[0],
    editorRef,
    open: (type: EmailType) => {
      setOpenedType(type);
      editorRef.current?.scrollIntoView({ block: 'nearest' });
    },
  };
}
