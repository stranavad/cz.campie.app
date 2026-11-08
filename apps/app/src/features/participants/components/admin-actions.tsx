import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { RegistrationDetail } from '@repo/schema/registrations';
import { czechDate } from '@repo/schema/shared';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useSelectedTurnusQuery } from '@/core/selected-turnus';
import {
  useAddParticipantMutation,
  useEditAnswersMutation,
  useEditGuardianMutation,
  useMoveRegistrationMutation,
  usePreviewAnswersMutation,
  usePreviewParticipantMutation,
} from '@/features/participants/api/participants.queries';
import { AnswersEditor } from '@/features/participants/components/answers-editor';

type Guardian = RegistrationDetail['guardians'][number];

function GuardianEditor({
  organisationId,
  registrationId,
  guardian,
}: {
  organisationId: string;
  registrationId: string;
  guardian: Guardian;
}) {
  const { t } = useTranslation('participants');
  const [firstName, setFirstName] = useState(guardian.firstName);
  const [lastName, setLastName] = useState(guardian.lastName);
  const [email, setEmail] = useState(guardian.email);
  const [phone, setPhone] = useState(guardian.phone ?? '');
  const edit = useEditGuardianMutation(organisationId, registrationId);

  return (
    <div className="flex flex-col gap-2 rounded-lg border p-3">
      <p className="text-sm font-medium">{t('edit.guardian', { number: guardian.position })}</p>
      <div className="grid gap-2 sm:grid-cols-2">
        <Input
          aria-label={t('edit.firstName')}
          value={firstName}
          onChange={(event) => setFirstName(event.target.value)}
        />
        <Input aria-label={t('edit.lastName')} value={lastName} onChange={(event) => setLastName(event.target.value)} />
        <Input
          aria-label={t('edit.email')}
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <Input
          aria-label={t('edit.phone')}
          type="tel"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
        />
      </div>
      {edit.isError ? <p className="text-sm text-destructive">{t('edit.failed')}</p> : null}
      <Button
        type="button"
        size="sm"
        className="self-start"
        disabled={edit.isPending}
        onClick={() =>
          edit.mutate({
            position: guardian.position,
            body: { firstName, lastName, email, phone: phone === '' ? null : phone },
          })
        }
      >
        {t('edit.save')}
      </Button>
    </div>
  );
}

// What an admin with Registrations write changes on a Registration: guardians, answers, a new child and the
// Turnus, each change of price shown before it is saved.
export function AdminActions({ organisationId, detail }: { organisationId: string; detail: RegistrationDetail }) {
  const { t } = useTranslation('participants');
  const previewAnswers = usePreviewAnswersMutation(organisationId, detail.id);
  const editAnswers = useEditAnswersMutation(organisationId, detail.id);
  const previewParticipant = usePreviewParticipantMutation(organisationId, detail.id);
  const addParticipant = useAddParticipantMutation(organisationId, detail.id);
  const move = useMoveRegistrationMutation(organisationId, detail.id);
  const turnusy = useSelectedTurnusQuery(organisationId, true);
  const [target, setTarget] = useState('');
  const others = (turnusy.data?.turnusy ?? []).filter(
    ({ id, campId }) => campId === detail.camp.id && id !== detail.turnus.id,
  );
  const answersOf = (participant: RegistrationDetail['participants'][number]) => ({
    firstName: participant.firstName,
    lastName: participant.lastName,
    birthDate: participant.birthDate,
    ...Object.fromEntries(
      participant.answers.filter(({ state }) => state !== 'removed').map(({ key, value }) => [key, value]),
    ),
  });

  return (
    <section className="flex flex-col gap-6">
      <h2 className="text-lg font-semibold">{t('edit.title')}</h2>
      {detail.guardians.map((guardian) => (
        <GuardianEditor
          key={`${guardian.position}-${guardian.email}`}
          organisationId={organisationId}
          registrationId={detail.id}
          guardian={guardian}
        />
      ))}
      <div className="flex flex-col gap-2 rounded-lg border p-3">
        <p className="text-sm font-medium">{t('edit.registrationAnswers')}</p>
        <AnswersEditor
          key={`registration-${detail.ledger.total}`}
          definition={detail.latestDefinition}
          scope="registration"
          initial={{}}
          onPreview={(answers) => previewAnswers.mutateAsync({ registration: answers, participants: [] })}
          onSave={(answers, expectedLines) =>
            editAnswers.mutate({ registration: answers, participants: [], expectedLines })
          }
          isSaving={editAnswers.isPending}
          failed={editAnswers.isError}
        />
      </div>
      {detail.participants.map((participant) => (
        <div key={participant.id} className="flex flex-col gap-2 rounded-lg border p-3">
          <p className="text-sm font-medium">
            {t('name', { first: participant.firstName, last: participant.lastName })}
          </p>
          <AnswersEditor
            key={`${participant.id}-${detail.ledger.total}`}
            definition={detail.latestDefinition}
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
        </div>
      ))}
      <div className="flex flex-col gap-2 rounded-lg border p-3">
        <p className="text-sm font-medium">{t('edit.addParticipant')}</p>
        <AnswersEditor
          key={`new-${detail.participants.length}`}
          definition={detail.latestDefinition}
          scope="participant"
          initial={{}}
          onPreview={(answers) => previewParticipant.mutateAsync({ answers })}
          onSave={(answers, expectedLines) => addParticipant.mutate({ answers, expectedLines })}
          isSaving={addParticipant.isPending}
          failed={addParticipant.isError}
        />
      </div>
      {others.length === 0 ? null : (
        <div className="flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-end">
          <label className="flex flex-1 flex-col gap-1 text-sm">
            {t('edit.move')}
            <select
              className="h-9 rounded-lg border border-input bg-transparent px-2"
              value={target}
              onChange={(event) => setTarget(event.target.value)}
            >
              <option value="">{t('edit.pickTurnus')}</option>
              {others.map((turnus) => (
                <option key={turnus.id} value={turnus.id}>
                  {t('edit.turnusOption', { name: turnus.name, date: czechDate(turnus.startDate) })}
                </option>
              ))}
            </select>
          </label>
          <Button
            type="button"
            size="sm"
            disabled={target === '' || move.isPending}
            onClick={() => move.mutate(target)}
          >
            {t('edit.moveButton')}
          </Button>
        </div>
      )}
    </section>
  );
}
