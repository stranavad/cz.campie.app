import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { TurnusForm } from '@/features/camps/components/turnus-section/turnus-form';
import { TurnusRow } from '@/features/camps/components/turnus-section/turnus-row';
import { useTurnusSection } from '@/features/camps/components/turnus-section/use-turnus-section.hook';

interface TurnusSectionProps {
  organisationId: string;
  campId: string;
  canWrite: boolean;
}

// A Camp's Turnusy with their places and availability; one is edited at a time.
export function TurnusSection({ organisationId, campId, canWrite }: TurnusSectionProps) {
  const { t } = useTranslation('camps');
  const section = useTurnusSection(organisationId, campId);
  const list = section.turnusy.data ?? [];
  const edited = list.find((turnus) => turnus.id === section.editing?.turnusId) ?? null;

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold">{t('turnus.title')}</h2>
      {section.turnusy.isPending ? <p className="text-muted-foreground">{t('loading')}</p> : null}
      {section.turnusy.isError ? <p className="text-destructive">{t('error')}</p> : null}
      {section.turnusy.isSuccess && list.length === 0 ? (
        <p className="text-muted-foreground">{t('turnus.empty')}</p>
      ) : null}
      <ul className="flex flex-col">
        {list.map((turnus) => (
          <TurnusRow
            key={turnus.id}
            turnus={turnus}
            canWrite={canWrite}
            isConfirmingRemoval={section.confirmingRemoval === turnus.id}
            isRemoving={section.isRemoving}
            onEdit={() => section.edit(turnus.id)}
            onAskToRemove={() => section.askToRemove(turnus.id)}
            onRemove={() => section.remove(turnus.id)}
            onCancelRemoval={section.cancelRemoval}
          />
        ))}
      </ul>
      {section.removalFailed ? (
        <p role="alert" className="text-sm text-destructive">
          {t('failure')}
        </p>
      ) : null}
      {section.editing === null ? (
        canWrite ? (
          <Button variant="outline" className="self-start" onClick={section.add}>
            {t('turnus.add')}
          </Button>
        ) : null
      ) : (
        <TurnusForm
          key={section.editing.turnusId ?? 'new'}
          organisationId={organisationId}
          campId={campId}
          turnusId={section.editing.turnusId}
          turnus={edited}
          onDone={section.close}
        />
      )}
    </section>
  );
}
