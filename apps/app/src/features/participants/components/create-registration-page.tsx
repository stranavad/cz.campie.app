import { Link, Navigate, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { REGISTRATION_FIELD_CATALOGUE } from '@repo/schema/camps';
import { formFields, type Answers, type AnswerValue } from '@repo/schema/form-engine';
import { czechDate } from '@repo/schema/shared';

import { Button } from '@/components/ui/button';
import { membershipAllows, useCurrentMembership } from '@/core/account';
import { RegistrationField } from '@/core/registration-form';
import {
  useCreateRegistrationMutation,
  useSelectedTurnusQuery,
  useTurnusFormQuery,
} from '@/features/participants/api/participants.queries';

// A Registration taken by phone or on paper: the Camp's form, outside window, capacity and age limits.
export function CreateRegistrationPage() {
  const { t } = useTranslation('participants');
  const navigate = useNavigate();
  const { membership, isLoading, isSignedOut } = useCurrentMembership();
  const organisationId = membership?.organisation.id ?? '';
  const canWrite = membershipAllows(membership, 'registrations', 'write');
  const turnusy = useSelectedTurnusQuery(organisationId, canWrite);
  const [turnusId, setTurnusId] = useState<string | null>(null);
  const chosen = turnusId ?? turnusy.data?.turnusId ?? turnusy.data?.turnusy[0]?.id ?? null;
  const form = useTurnusFormQuery(organisationId, chosen);
  const create = useCreateRegistrationMutation(organisationId);
  const [registration, setRegistration] = useState<Answers>({});
  const [children, setChildren] = useState<Answers[]>([{}]);
  const [ticked, setTicked] = useState<readonly string[]>([]);
  const [key] = useState(() => crypto.randomUUID());

  if (isSignedOut) {
    return <Navigate to="/platform/prihlaseni" replace />;
  }

  if (isLoading || turnusy.isPending) {
    return <p className="py-12 text-muted-foreground">{t('loading')}</p>;
  }

  if (!canWrite) {
    return <p className="py-12">{t('noAccess')}</p>;
  }

  const definition = form.data?.definition;

  return (
    <div className="flex flex-col gap-6 py-8">
      <Link to="/platform/prihlasky" className="text-sm text-muted-foreground underline">
        {t('detail.back')}
      </Link>
      <h1 className="text-2xl font-semibold">{t('create.title')}</h1>
      <p className="text-sm text-muted-foreground">{t('create.intro')}</p>
      <label className="flex flex-col gap-1 text-sm font-medium sm:max-w-md">
        {t('turnus')}
        <select
          className="h-9 rounded-lg border border-input bg-transparent px-2"
          value={chosen ?? ''}
          onChange={(event) => setTurnusId(event.target.value)}
        >
          {turnusy.data?.turnusy.map((turnus) => (
            <option key={turnus.id} value={turnus.id}>
              {t('turnusOption', { camp: turnus.campName, turnus: turnus.name, date: czechDate(turnus.startDate) })}
            </option>
          ))}
        </select>
      </label>
      {form.isError ? <p className="text-destructive">{t('create.noForm')}</p> : null}
      {definition === undefined ? null : (
        <>
          <fieldset className="flex flex-col gap-3 rounded-lg border p-4">
            <legend className="px-1 font-medium">{t('create.guardian')}</legend>
            {formFields(definition, REGISTRATION_FIELD_CATALOGUE, 'registration').map((field) => (
              <RegistrationField
                key={field.key}
                field={field}
                value={registration[field.key]}
                onChange={(value: AnswerValue) => setRegistration({ ...registration, [field.key]: value })}
              />
            ))}
          </fieldset>
          {children.map((answers, index) => (
            <fieldset key={index} className="flex flex-col gap-3 rounded-lg border p-4">
              <legend className="px-1 font-medium">{t('create.child', { number: index + 1 })}</legend>
              {formFields(definition, REGISTRATION_FIELD_CATALOGUE, 'participant').map((field) => (
                <RegistrationField
                  key={field.key}
                  field={field}
                  value={answers[field.key]}
                  onChange={(value: AnswerValue) =>
                    setChildren(children.map((child, at) => (at === index ? { ...child, [field.key]: value } : child)))
                  }
                />
              ))}
            </fieldset>
          ))}
          {children.length < (form.data?.maxParticipants ?? 1) ? (
            <Button
              type="button"
              variant="outline"
              className="self-start"
              onClick={() => setChildren([...children, {}])}
            >
              {t('create.addChild')}
            </Button>
          ) : null}
          {(form.data?.declarations ?? []).map((declaration) => (
            <label key={declaration.id} className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                checked={ticked.includes(declaration.id)}
                onChange={(event) =>
                  setTicked(
                    event.target.checked ? [...ticked, declaration.id] : ticked.filter((id) => id !== declaration.id),
                  )
                }
              />
              {declaration.text}
            </label>
          ))}
          {create.isError ? <p className="text-sm text-destructive">{t('create.failed')}</p> : null}
          <Button
            type="button"
            className="self-start"
            disabled={create.isPending || chosen === null}
            onClick={() =>
              form.data === undefined || chosen === null
                ? undefined
                : create.mutate(
                    {
                      campId: form.data.campId,
                      body: {
                        idempotencyKey: key,
                        turnusId: chosen,
                        submission: { registration, participants: children },
                        paymentChoice: 'full',
                        discountCode: null,
                        declarations: (form.data.declarations ?? []).map(({ id }) => ({
                          id,
                          accepted: ticked.includes(id),
                        })),
                      },
                    },
                    {
                      onSuccess: ({ id }) =>
                        void navigate({ to: '/platform/prihlasky/$registrationId', params: { registrationId: id } }),
                    },
                  )
            }
          >
            {t('create.submit')}
          </Button>
        </>
      )}
    </div>
  );
}
