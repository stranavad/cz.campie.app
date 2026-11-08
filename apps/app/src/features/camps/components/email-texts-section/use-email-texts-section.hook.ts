import { useRef, useState } from 'react';

import type { EmailType } from '@repo/schema/emails';

import { useEmailTextsQuery } from '@/features/camps/api/camps.queries';

// The Camp's emails and the one opened to edit: the first until another is picked.
export function useEmailTextsSection(organisationId: string, campId: string) {
  const emails = useEmailTextsQuery(organisationId, campId);
  const [openedType, setOpenedType] = useState<EmailType | null>(null);
  // The editor sits under the list on a phone, so opening an email brings it into view.
  const editorRef = useRef<HTMLElement>(null);
  const list = emails.data ?? [];

  return {
    emails,
    opened: list.find((email) => email.type === openedType) ?? list[0],
    editorRef,
    open: (type: EmailType) => {
      setOpenedType(type);
      editorRef.current?.scrollIntoView({ block: 'nearest' });
    },
  };
}
