import { useId, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import type { RegistrationDetail } from '@repo/schema/registrations';
import { czechDate } from '@repo/schema/shared';

import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardHeader } from '@/components/ui/card';
import { DescriptionItem, DescriptionList } from '@/components/ui/description-list';
import { ClaimedDiscounts } from '@/features/participants/components/registration-detail/claimed-discounts';
import { useAnswerText } from '@/features/participants/components/registration-detail/use-answer-text.hook';

interface ParticipantDetailCardProps {
  participant: RegistrationDetail['participants'][number];
  discounts: RegistrationDetail['claimedDiscounts'];
  // The child's checklist chips, shown folded too.
  checklist: ReactNode;
  // A second child starts folded, so the page opens on the first.
  folded: boolean;
  canWrite: boolean;
  onVerify: (fieldId: string, optionId: string | null) => void;
  isVerifying: boolean;
}

// One child: who, their answers and the discounts claimed for them, with their checklist.
export function ParticipantDetailCard({
  participant,
  discounts,
  checklist,
  folded,
  ...verifying
}: ParticipantDetailCardProps) {
  const { t } = useTranslation('participants');
  const { answerText, answerLabel } = useAnswerText();
  const [isOpen, setOpen] = useState(!folded);
  const bodyId = useId();
  const name = t('name', { first: participant.firstName, last: participant.lastName });
  const hasFacts = participant.birthDate !== null || participant.answers.length > 0;
  const hasBody = hasFacts || discounts.length > 0;

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
        {folded && hasBody ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            aria-expanded={isOpen}
            aria-controls={bodyId}
            onClick={() => setOpen(!isOpen)}
          >
            {t(isOpen ? 'detail.fold' : 'detail.unfold')}
          </Button>
        ) : null}
      </CardHeader>
      {hasBody ? (
        <div id={bodyId} hidden={!isOpen} className="flex flex-col gap-4">
          {hasFacts ? (
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
          ) : null}
          {discounts.length === 0 ? null : <ClaimedDiscounts discounts={discounts} {...verifying} />}
        </div>
      ) : null}
      {checklist}
    </Card>
  );
}
