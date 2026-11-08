import { FileTextIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import type { RegistrationDetail } from '@repo/schema/registrations';
import { czechDate } from '@repo/schema/shared';

import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardHeader } from '@/components/ui/card';
import { DescriptionItem, DescriptionList } from '@/components/ui/description-list';
import { ClaimedDiscounts } from '@/features/participants/components/registration-detail/claimed-discounts';
import { useAnswerText } from '@/features/participants/components/registration-detail/use-answer-text.hook';

interface ParticipantDetailCardProps {
  participant: RegistrationDetail['participants'][number];
  discounts: RegistrationDetail['claimedDiscounts'];
  canWrite: boolean;
  onVerify: (fieldId: string, optionId: string | null) => void;
  isVerifying: boolean;
}

// One child: who, their answers, the Přihláška PDF and the discounts claimed for them.
export function ParticipantDetailCard({ participant, discounts, ...verifying }: ParticipantDetailCardProps) {
  const { t } = useTranslation('participants');
  const { answerText, answerLabel } = useAnswerText();
  const name = t('name', { first: participant.firstName, last: participant.lastName });

  return (
    <Card>
      <CardHeader className="items-center">
        <Avatar name={name} className="size-11 text-sm" />
        <div className="flex min-w-0 flex-1 flex-col leading-tight">
          <h2 className="text-heading break-words">{name}</h2>
          {participant.ageOnStart === null ? null : (
            <span className="text-sm text-muted-foreground">
              {t('detail.ageLine', { age: t('age', { count: participant.ageOnStart }) })}
            </span>
          )}
        </div>
        {participant.status === 'cancelled' ? <Badge>{t('cancelled')}</Badge> : null}
        {participant.prihlaska === null ? null : (
          <a
            href={participant.prihlaska.url}
            target="_blank"
            rel="noreferrer"
            className={buttonVariants({ variant: 'outline', size: 'sm' })}
          >
            <FileTextIcon aria-hidden="true" />
            {t('detail.prihlaska')}
          </a>
        )}
      </CardHeader>
      {participant.birthDate === null && participant.answers.length === 0 ? null : (
        <DescriptionList className="sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3">
          {participant.birthDate === null ? null : (
            <DescriptionItem label={t('detail.birthDate')}>{czechDate(participant.birthDate)}</DescriptionItem>
          )}
          {participant.answers.map((row) => (
            <DescriptionItem key={row.key} label={answerLabel(row)}>
              {answerText(row)}
            </DescriptionItem>
          ))}
        </DescriptionList>
      )}
      {discounts.length === 0 ? null : <ClaimedDiscounts discounts={discounts} {...verifying} />}
    </Card>
  );
}
