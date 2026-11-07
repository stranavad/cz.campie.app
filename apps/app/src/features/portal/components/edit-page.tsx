import { Link, Navigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

import { czechDate } from '@repo/schema/shared';

import { useGuardianEditQuery } from '@/features/portal/api/portal.queries';
import { AddGuardianCard } from '@/features/portal/components/add-guardian-card';
import { GuardianCard } from '@/features/portal/components/guardian-card';
import { NewFieldsCard } from '@/features/portal/components/new-fields-card';
import { HttpError } from '@/lib/api';

// What a guardian may change on a Registration until the camp's lock date, and what they only see.
export function EditPage({ registrationId }: { registrationId: string }) {
  const { t } = useTranslation('portal');
  const edit = useGuardianEditQuery(registrationId);

  if (edit.error instanceof HttpError && edit.error.status === 401) {
    return <Navigate to="/organisation/portal/prihlaseni" replace />;
  }

  if (edit.isPending) {
    return null;
  }

  if (edit.isError) {
    return <p className="py-12">{t('error')}</p>;
  }

  const { data } = edit;

  return (
    <section className="flex flex-col gap-6 py-8">
      <Link to="/organisation/portal" className="text-sm underline">
        {t('edit.back')}
      </Link>
      <h1 className="text-2xl font-semibold">{t('edit.title')}</h1>
      {data.editable ? (
        data.lockDate === null ? null : (
          <p className="text-sm text-muted-foreground">{t('edit.until', { date: czechDate(data.lockDate) })}</p>
        )
      ) : (
        <output className="block text-sm">{t('edit.readOnly')}</output>
      )}
      {data.guardians.map((guardian) => (
        <GuardianCard
          key={`${guardian.position}-${guardian.email}`}
          registrationId={registrationId}
          guardian={guardian}
          editable={data.editable}
        />
      ))}
      {data.editable && data.guardians.length < 2 ? <AddGuardianCard registrationId={registrationId} /> : null}
      <NewFieldsCard registrationId={registrationId} edit={data} />
      {data.removed.length === 0 ? null : (
        <section className="flex flex-col gap-2">
          <h2 className="font-medium">{t('edit.removed')}</h2>
          {data.removed.map((answer, index) => (
            <p key={index} className="text-sm text-muted-foreground">
              {t('edit.removedAnswer', {
                label: answer.label,
                answer:
                  typeof answer.value === 'boolean'
                    ? t(answer.value ? 'edit.yes' : 'edit.no')
                    : Array.isArray(answer.value)
                      ? answer.value.join(', ')
                      : String(answer.value ?? ''),
              })}
            </p>
          ))}
        </section>
      )}
    </section>
  );
}
