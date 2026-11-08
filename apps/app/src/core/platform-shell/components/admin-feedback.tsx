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
    <div className="mx-auto w-full max-w-7xl px-4 pb-6 text-sm text-muted-foreground sm:px-6 lg:px-10">
      <ProblemForm
        label={t('feedback.adminLink')}
        title={t('feedback.adminTitle')}
        description={t('feedback.adminDescription')}
        askEmail={false}
        send={(text) =>
          feedbackService.send(membership.organisation.id, text, `${window.location.origin}${window.location.pathname}`)
        }
      />
    </div>
  );
}
