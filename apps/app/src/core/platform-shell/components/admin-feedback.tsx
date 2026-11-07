import { useTranslation } from 'react-i18next';

import { useCurrentMembership } from '@/core/account';
import { feedbackService, ProblemForm } from '@/core/feedback';

// Feedback or a problem report from any admin page, with the Organisation and page attached.
export function AdminFeedback() {
  const { t } = useTranslation();
  const { membership } = useCurrentMembership();

  if (membership === undefined) {
    return null;
  }

  return (
    <footer className="mx-auto w-full max-w-5xl px-4 py-6 text-sm text-muted-foreground">
      <ProblemForm
        label={t('feedback.adminLink')}
        askEmail={false}
        send={(text) => feedbackService.send(membership.organisation.id, text, window.location.href.slice(0, 500))}
      />
    </footer>
  );
}
