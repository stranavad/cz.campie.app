import { CheckIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Badge } from '@/components/ui/badge';
import type { useParticipantChecklist } from '@/features/participants/components/registration-detail/use-participant-checklist.hook';

interface ParticipantChecklistProps {
  checklist: ReturnType<ReturnType<typeof useParticipantChecklist>>;
}

const DOCUMENT_VARIANT = { missing: 'danger', returned: 'danger', pending: 'warning' } as const;
const CHIP = 'h-auto min-h-8.5 max-w-full px-3 py-1 text-sm whitespace-normal';

// The child's Consents, the documents still open and the unanswered questions, as chips; the cards below
// hold the actions.
export function ParticipantChecklist({ checklist }: ParticipantChecklistProps) {
  const { t } = useTranslation('participants');
  const { consents, documents, unanswered } = checklist;

  if (consents === null && documents.length === 0 && unanswered.length === 0) {
    return null;
  }

  return (
    <ul aria-label={t('checklist.label')} className="flex flex-wrap gap-2">
      {consents === null ? null : (
        <li>
          <Badge variant={consents.signed === consents.total ? 'success' : 'danger'} className={CHIP}>
            {consents.signed === consents.total ? <CheckIcon aria-hidden="true" /> : null}
            {t('checklist.consents', consents)}
          </Badge>
        </li>
      )}
      {documents.map((document) => (
        <li key={document.id}>
          <Badge variant={DOCUMENT_VARIANT[document.status]} className={CHIP}>
            {t(`checklist.document.${document.status}`, { name: document.name })}
          </Badge>
        </li>
      ))}
      {unanswered.map((row) => (
        <li key={row.key}>
          <Badge className={CHIP}>{t('checklist.unanswered', { label: row.label })}</Badge>
        </li>
      ))}
    </ul>
  );
}
