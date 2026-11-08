import { useTranslation } from 'react-i18next';

import type { RegistrationDetail } from '@repo/schema/registrations';

import { Card, CardTitle } from '@/components/ui/card';
import { DescriptionItem, DescriptionList } from '@/components/ui/description-list';
import { useAnswerText } from '@/features/participants/components/registration-detail/use-answer-text.hook';
import { UndeliverableBadge } from '@/features/participants/components/undeliverable-badge';

interface GuardiansCardProps {
  organisationId: string;
  registrationId: string;
  detail: RegistrationDetail;
  canWrite: boolean;
}

// The guardians and how to reach them, and the answers given for the whole Registration.
export function GuardiansCard({ organisationId, registrationId, detail, canWrite }: GuardiansCardProps) {
  const { t } = useTranslation('participants');
  const { answerText, answerLabel } = useAnswerText();

  return (
    <Card>
      <CardTitle>{t('detail.guardians')}</CardTitle>
      {detail.guardians.length === 0 ? null : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {detail.guardians.map((guardian) => (
            <li key={guardian.position} className="flex min-w-0 flex-col gap-0.5">
              <span className="font-semibold">
                {t('detail.guardianName', { first: guardian.firstName, last: guardian.lastName })}
              </span>
              <a href={`mailto:${guardian.email}`} className="break-all text-muted-foreground hover:underline">
                {guardian.email}
              </a>
              {guardian.phone === null ? null : (
                <a href={`tel:${guardian.phone}`} className="text-muted-foreground hover:underline">
                  {guardian.phone}
                </a>
              )}
              {guardian.undeliverable ? (
                <UndeliverableBadge
                  organisationId={organisationId}
                  registrationId={registrationId}
                  email={guardian.email}
                  canClear={canWrite}
                />
              ) : null}
            </li>
          ))}
        </ul>
      )}
      {detail.registrationAnswers.length === 0 ? null : (
        <DescriptionList className="border-t border-border-subtle pt-4">
          {detail.registrationAnswers.map((row) => (
            <DescriptionItem key={row.key} label={answerLabel(row)}>
              {answerText(row)}
            </DescriptionItem>
          ))}
        </DescriptionList>
      )}
    </Card>
  );
}
