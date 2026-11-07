import { useTranslation } from 'react-i18next';

import type { CampBranding } from '@repo/schema/camps';

import { AccentPreview } from '@/core/branding';
import { useCampAccentForm } from '@/features/camps/components/camp-branding-section/use-camp-accent-form.hook';

interface CampAccentFormProps {
  organisationId: string;
  campId: string;
  branding: CampBranding;
  canWrite: boolean;
}

export function CampAccentForm({ organisationId, campId, branding, canWrite }: CampAccentFormProps) {
  const { t } = useTranslation('camps');
  const { form, status } = useCampAccentForm(organisationId, campId, branding);

  return (
    <form
      noValidate
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        void form.handleSubmit();
      }}
    >
      <fieldset disabled={!canWrite} className="flex flex-col gap-4">
        <form.AppField name="ownColour">
          {(field) => <field.CheckboxField label={t('branding.ownColour')} />}
        </form.AppField>
        <form.Subscribe selector={(state) => state.values.ownColour}>
          {(ownColour) =>
            ownColour ? (
              <form.AppField name="accentColour">
                {(field) => (
                  <div className="flex flex-col gap-3">
                    <field.TextField label={t('branding.accentColour')} description={t('branding.accentColourHint')} />
                    <AccentPreview accentColour={field.state.value} />
                  </div>
                )}
              </form.AppField>
            ) : null
          }
        </form.Subscribe>
      </fieldset>
      {status === 'saved' ? <output className="block text-sm">{t('saved')}</output> : null}
      {status === 'failed' ? (
        <p role="alert" className="text-sm text-destructive">
          {t('failure')}
        </p>
      ) : null}
      {canWrite ? (
        <form.AppForm>
          <form.SubmitButton className="self-start">{t('save')}</form.SubmitButton>
        </form.AppForm>
      ) : null}
    </form>
  );
}
