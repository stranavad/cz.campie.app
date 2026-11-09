import { useTranslation } from 'react-i18next';

import type { RegistrationDetail } from '@repo/schema/registrations';

import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  useAddParticipantMutation,
  useEditAnswersMutation,
  usePreviewAnswersMutation,
  usePreviewParticipantMutation,
} from '@/features/participants/api/participants.queries';
import { AnswersEditor } from '@/features/participants/components/editing/answers-editor';
import { EditorTile } from '@/features/participants/components/editing/editor-tile';
import { GuardianEditor } from '@/features/participants/components/editing/guardian-editor';

interface AdminActionsProps {
  organisationId: string;
  detail: RegistrationDetail;
  // Health data is changed only with Health write, so its fields are left out of the editors without it.
  canWriteHealth: boolean;
}

// What an admin with Registrations write changes on a Registration: guardians, answers and a new child, each
// change of price shown before it is saved. Moving to another Turnus is in the header's menu.
export function AdminActions({ organisationId, detail, canWriteHealth }: AdminActionsProps) {
  const { t } = useTranslation('participants');
  const previewAnswers = usePreviewAnswersMutation(organisationId, detail.id);
  const editAnswers = useEditAnswersMutation(organisationId, detail.id);
  const previewParticipant = usePreviewParticipantMutation(organisationId, detail.id);
  const addParticipant = useAddParticipantMutation(organisationId, detail.id);
  const editor = { definition: detail.latestDefinition, withHealth: canWriteHealth };
  const answersOf = (participant: RegistrationDetail['participants'][number]) => ({
    firstName: participant.firstName,
    lastName: participant.lastName,
    birthDate: participant.birthDate,
    ...Object.fromEntries(
      participant.answers.filter(({ state }) => state !== 'removed').map(({ key, value }) => [key, value]),
    ),
  });

  return (
    <Card>
      <CardHeader className="flex-col gap-1">
        <CardTitle>{t('edit.title')}</CardTitle>
        <CardDescription>{t('edit.intro')}</CardDescription>
      </CardHeader>
      {detail.guardians.map((guardian) => (
        <GuardianEditor
          key={`${guardian.position}-${guardian.email}`}
          organisationId={organisationId}
          registrationId={detail.id}
          guardian={guardian}
        />
      ))}
      <EditorTile title={t('edit.registrationAnswers')}>
        <AnswersEditor
          key={`registration-${detail.ledger.total}`}
          {...editor}
          scope="registration"
          initial={{}}
          onPreview={(answers) => previewAnswers.mutateAsync({ registration: answers, participants: [] })}
          onSave={(answers, expectedLines) =>
            editAnswers.mutate({ registration: answers, participants: [], expectedLines })
          }
          isSaving={editAnswers.isPending}
          failed={editAnswers.isError}
        />
      </EditorTile>
      {detail.participants.map((participant) => (
        <EditorTile
          key={participant.id}
          title={t('name', { first: participant.firstName, last: participant.lastName })}
        >
          <AnswersEditor
            key={`${participant.id}-${detail.ledger.total}`}
            {...editor}
            scope="participant"
            initial={answersOf(participant)}
            onPreview={(answers) =>
              previewAnswers.mutateAsync({
                registration: {},
                participants: [{ participantId: participant.id, answers }],
              })
            }
            onSave={(answers, expectedLines) =>
              editAnswers.mutate({
                registration: {},
                participants: [{ participantId: participant.id, answers }],
                expectedLines,
              })
            }
            isSaving={editAnswers.isPending}
            failed={editAnswers.isError}
          />
        </EditorTile>
      ))}
      <EditorTile title={t('edit.addParticipant')}>
        <AnswersEditor
          key={`new-${detail.participants.length}`}
          {...editor}
          scope="participant"
          initial={{}}
          onPreview={(answers) => previewParticipant.mutateAsync({ answers })}
          onSave={(answers, expectedLines) => addParticipant.mutate({ answers, expectedLines })}
          isSaving={addParticipant.isPending}
          failed={addParticipant.isError}
        />
      </EditorTile>
    </Card>
  );
}
