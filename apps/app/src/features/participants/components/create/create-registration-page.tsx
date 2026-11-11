import { LockIcon, PlusIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { EmptyState } from '@/components/empty-state';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { LoginRedirect } from '@/core/account';
import { CampQuestions } from '@/features/participants/components/create/camp-questions';
import { CreateDeclarations } from '@/features/participants/components/create/create-declarations';
import { CreateSummary } from '@/features/participants/components/create/create-summary';
import { FormSection } from '@/features/participants/components/create/form-section';
import { useCreateRegistrationPage } from '@/features/participants/components/create/use-create-registration-page.hook';
import { BackToList } from '@/features/participants/components/registration-detail/back-to-list';
import { DetailSkeleton } from '@/features/participants/components/registration-detail/detail-skeleton';

// A Registration taken by phone or on paper: the Camp's form, outside window, capacity and age limits.
export function CreateRegistrationPage() {
  const { t } = useTranslation('participants');
  const page = useCreateRegistrationPage();

  if (page.isSignedOut) {
    return <LoginRedirect />;
  }

  if (page.isLoading) {
    return <DetailSkeleton />;
  }

  if (!page.canWrite) {
    return <EmptyState icon={<LockIcon />} title={t('noAccess')} />;
  }

  const { definition } = page;

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <PageHeader eyebrow={<BackToList />} title={t('create.title')} description={t('create.intro')} />
      <div className="grid items-start gap-4 lg:grid-cols-5">
        <div className="flex min-w-0 flex-col gap-4 lg:col-span-3">
          {page.isFormLoading ? <Skeleton className="h-96 rounded-3xl" /> : null}
          {definition === undefined ? null : (
            <>
              <FormSection
                title={t('create.guardian')}
                fields={page.asked(definition, 'registration', 'own')}
                answers={page.registration}
                onChange={page.setRegistration}
              />
              {page.children.map((answers, index) => (
                <FormSection
                  key={index}
                  title={page.children.length > 1 ? t('create.child', { number: index + 1 }) : t('create.onlyChild')}
                  fields={page.asked(definition, 'participant', 'own')}
                  answers={answers}
                  onChange={(changed) => page.setChild(index, changed)}
                />
              ))}
              {page.canAddChild ? (
                <Button type="button" variant="dashed" size="lg" className="rounded-[20px]" onClick={page.addChild}>
                  <PlusIcon aria-hidden="true" />
                  {t('create.addChild')}
                </Button>
              ) : null}
              <CampQuestions
                registrationFields={page.asked(definition, 'registration', 'questions')}
                childFields={page.asked(definition, 'participant', 'questions')}
                registration={page.registration}
                onRegistration={page.setRegistration}
                childAnswers={page.children}
                onChild={page.setChild}
              />
              <CreateDeclarations declarations={page.declarations} ticked={page.ticked} onTick={page.tick} />
            </>
          )}
        </div>
        <CreateSummary page={page} />
      </div>
    </div>
  );
}
