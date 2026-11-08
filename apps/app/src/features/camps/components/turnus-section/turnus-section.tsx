import { CalendarRangeIcon, PlusIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { EmptyState } from '@/components/empty-state';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { TurnusForm } from '@/features/camps/components/turnus-section/turnus-form';
import { TurnusRow } from '@/features/camps/components/turnus-section/turnus-row';
import { useTurnusSection } from '@/features/camps/components/turnus-section/use-turnus-section.hook';
import { cn } from '@/lib/utils';

interface TurnusSectionProps {
  organisationId: string;
  campId: string;
  canWrite: boolean;
}

// A Camp's Turnusy as cards with their places and availability; one is edited at a time, beside the list.
export function TurnusSection({ organisationId, campId, canWrite }: TurnusSectionProps) {
  const { t } = useTranslation('camps');
  const section = useTurnusSection(organisationId, campId);

  if (section.turnusy.isPending) {
    return <p className="text-muted-foreground">{t('loading')}</p>;
  }

  if (section.turnusy.isError) {
    return <Alert variant="danger">{t('error')}</Alert>;
  }

  return (
    <div className={cn('grid items-start gap-4', canWrite && 'lg:grid-cols-5')}>
      <div className="flex min-w-0 flex-col gap-3 lg:col-span-3">
        {section.list.length === 0 ? (
          <EmptyState icon={<CalendarRangeIcon aria-hidden="true" />} title={t('turnus.empty')} />
        ) : (
          <ul className="flex flex-col gap-3">
            {section.list.map((turnus) => (
              <TurnusRow
                key={turnus.id}
                turnus={turnus}
                // While a Turnus is open in the editor, another can't be opened over it and lose its edits.
                canWrite={canWrite && (section.editing === null || section.editing.turnusId === turnus.id)}
                isEditing={section.editing?.turnusId === turnus.id}
                onEdit={() => section.edit(turnus.id)}
              />
            ))}
          </ul>
        )}
        {section.removalFailed ? (
          <Alert variant="danger" role="alert">
            {t('failure')}
          </Alert>
        ) : null}
        {canWrite && section.editing === null ? (
          <Button variant="dashed" size="lg" className="rounded-[20px]" onClick={section.add}>
            <PlusIcon aria-hidden="true" />
            {t('turnus.add')}
          </Button>
        ) : null}
      </div>
      {canWrite ? (
        <div className="min-w-0 lg:col-span-2">
          {section.editing === null ? (
            <p className="hidden rounded-3xl border border-dashed border-input px-6 py-10 text-center text-sm text-muted-foreground lg:block">
              {t('turnus.pick')}
            </p>
          ) : (
            <TurnusForm
              key={section.editing.turnusId ?? 'new'}
              organisationId={organisationId}
              campId={campId}
              turnusId={section.editing.turnusId}
              turnus={section.edited}
              removal={section.removalOf(section.editing.turnusId)}
              onDone={section.close}
            />
          )}
        </div>
      ) : null}
    </div>
  );
}
