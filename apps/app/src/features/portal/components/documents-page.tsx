import { Link, Navigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

import { czechDate } from '@repo/schema/shared';

import { useGuardianDocumentsQuery } from '@/features/portal/api/portal.queries';
import { HttpError } from '@/lib/api';

// A Registration's documents: what the camp publishes to download, and what each child hands in.
export function DocumentsPage({ registrationId }: { registrationId: string }) {
  const { t } = useTranslation('portal');
  const documents = useGuardianDocumentsQuery(registrationId);

  if (documents.error instanceof HttpError && documents.error.status === 401) {
    return <Navigate to="/organisation/portal/prihlaseni" replace />;
  }

  if (documents.isPending) {
    return null;
  }

  if (documents.isError) {
    return <p className="py-12">{t('error')}</p>;
  }

  const { downloads, requirements } = documents.data;

  return (
    <section className="flex flex-col gap-6 py-8">
      <Link to="/organisation/portal" className="text-sm underline">
        {t('edit.back')}
      </Link>
      <h1 className="text-2xl font-semibold">{t('documents.title')}</h1>
      {downloads.length === 0 && requirements.length === 0 ? <p>{t('documents.none')}</p> : null}
      {requirements.length === 0 ? null : (
        <article className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold">{t('documents.requirements')}</h2>
          <ul className="flex flex-col divide-y rounded-lg border text-sm">
            {requirements.map((requirement) => (
              <li key={requirement.id} className="flex flex-col gap-1 p-3">
                <span className="font-medium">{requirement.name}</span>
                {requirement.description === '' ? null : (
                  <p className="whitespace-pre-line">{requirement.description}</p>
                )}
                {requirement.dueDate === null ? null : (
                  <span>{t('documents.dueBy', { date: czechDate(requirement.dueDate) })}</span>
                )}
                {requirement.blankForm === null ? null : (
                  <a href={requirement.blankForm.url} target="_blank" rel="noreferrer" className="self-start underline">
                    {t('documents.blankForm')}
                  </a>
                )}
              </li>
            ))}
          </ul>
        </article>
      )}
      {downloads.length === 0 ? null : (
        <article className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold">{t('documents.downloads')}</h2>
          <ul className="flex flex-col divide-y rounded-lg border text-sm">
            {downloads.map((download) => (
              <li key={download.id} className="flex flex-col gap-1 p-3">
                <a href={download.file.url} target="_blank" rel="noreferrer" className="font-medium underline">
                  {download.name}
                </a>
                {download.description === '' ? null : <p className="whitespace-pre-line">{download.description}</p>}
              </li>
            ))}
          </ul>
        </article>
      )}
    </section>
  );
}
