import { useTranslation } from 'react-i18next';

import type { Turnus } from '@repo/schema/camps';

import { SettingSwitch } from '@/components/setting-switch';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardTitle } from '@/components/ui/card';
import { FieldLegend, FieldSet } from '@/components/ui/field';
import { TURNUS_FORM_GROUPS } from '@/features/camps/components/turnus-section/turnus-form.constants';
import { TurnusRemoval, type TurnusRemovalProps } from '@/features/camps/components/turnus-section/turnus-removal';
import { useTurnusForm } from '@/features/camps/components/turnus-section/use-turnus-form.hook';
import { cn } from '@/lib/utils';

interface TurnusFormProps {
  organisationId: string;
  campId: string;
  // Null adds a new Turnus.
  turnusId: string | null;
  // The Turnus's saved values; null for a new one.
  turnus: Turnus | null;
  // Removing the Turnus being edited; null for a new one.
  removal: TurnusRemovalProps | null;
  onDone: () => void;
}

export function TurnusForm({ organisationId, campId, turnusId, turnus, removal, onDone }: TurnusFormProps) {
  const { t } = useTranslation('camps');
  const { form, hasFailed, revealRef } = useTurnusForm(organisationId, campId, { turnusId, turnus }, onDone);

  return (
    <Card ref={revealRef} aria-label={t('turnus.editor')} className="scroll-mt-4">
      <CardTitle>{turnus?.name ?? t('turnus.new')}</CardTitle>
      <form
        noValidate
        className="flex flex-col gap-6"
        onSubmit={(event) => {
          event.preventDefault();
          void form.handleSubmit();
        }}
      >
        {TURNUS_FORM_GROUPS.map(({ legend, fields }) => (
          <FieldSet key={legend} className="min-w-0">
            <FieldLegend>{t(`turnus.groups.${legend}`)}</FieldLegend>
            <div className="grid grid-cols-2 items-start gap-x-3 gap-y-4">
              {fields.map(([name, type, wide]) => (
                <div key={name} className={cn('min-w-0', wide && 'col-span-2')}>
                  <form.AppField name={name}>
                    {(field) => {
                      const label = t(`turnus.fields.${name}`);
                      // The run's own dates are required; every other date may stay empty.
                      const clearable = name !== 'startDate' && name !== 'endDate';

                      if (type === 'date') {
                        return <field.DateField label={label} clearable={clearable} />;
                      }

                      if (type === 'datetime') {
                        return <field.DateTimeField label={label} clearable={clearable} />;
                      }

                      return (
                        <field.TextField
                          label={label}
                          type={type}
                          inputMode={type === 'number' ? 'numeric' : undefined}
                        />
                      );
                    }}
                  </form.AppField>
                </div>
              ))}
              {legend === 'window' ? (
                <form.AppField name="closedManually">
                  {(field) => (
                    <SettingSwitch
                      label={t('turnus.fields.closedManually')}
                      checked={field.state.value}
                      onCheckedChange={field.handleChange}
                      className="col-span-2"
                    />
                  )}
                </form.AppField>
              ) : null}
            </div>
          </FieldSet>
        ))}
        {hasFailed ? (
          <Alert variant="danger" role="alert">
            {t('failure')}
          </Alert>
        ) : null}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border-subtle pt-4">
          {removal === null ? <span /> : <TurnusRemoval {...removal} />}
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="ghost" onClick={onDone}>
              {t('turnus.cancel')}
            </Button>
            <form.AppForm>
              <form.SubmitButton>{t('save')}</form.SubmitButton>
            </form.AppForm>
          </div>
        </div>
      </form>
    </Card>
  );
}
