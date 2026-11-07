import { useId } from 'react';
import { useTranslation } from 'react-i18next';

import { accentColourSchema, type OrganisationSettings } from '@repo/schema/organisations';

import { AccentPreview } from '@/features/organisation-settings/components/branding-form/accent-preview';
import { useBrandingForm } from '@/features/organisation-settings/components/branding-form/use-branding-form.hook';

interface BrandingFormProps {
  organisationId: string;
  settings: OrganisationSettings;
}

// The display name and accent colour of the public pages, emails and documents.
export function BrandingForm({ organisationId, settings }: BrandingFormProps) {
  const { t } = useTranslation('organisationSettings');
  const { form, status } = useBrandingForm(organisationId, settings);
  const pickerId = useId();

  return (
    <form
      noValidate
      className="flex max-w-xl flex-col gap-5"
      onSubmit={(event) => {
        event.preventDefault();
        void form.handleSubmit();
      }}
    >
      <form.AppField name="displayName">
        {(field) => <field.TextField label={t('branding.displayName')} description={t('branding.displayNameHint')} />}
      </form.AppField>
      <form.AppField name="accentColour">
        {(field) => (
          <div className="flex flex-col gap-3">
            <div className="flex items-end gap-3">
              <input
                id={pickerId}
                type="color"
                aria-label={t('branding.accentPicker')}
                className="h-9 w-12 cursor-pointer rounded-lg border border-input bg-background"
                value={accentColourSchema.safeParse(field.state.value).data ?? '#000000'}
                onChange={(event) => field.handleChange(event.target.value)}
              />
              <div className="flex-1">
                <field.TextField label={t('branding.accentColour')} description={t('branding.accentColourHint')} />
              </div>
            </div>
            <AccentPreview accentColour={field.state.value} />
          </div>
        )}
      </form.AppField>
      {status === 'saved' ? <output className="block text-sm">{t('saved')}</output> : null}
      {status === 'failed' ? (
        <p role="alert" className="text-sm text-destructive">
          {t('failure')}
        </p>
      ) : null}
      <form.AppForm>
        <form.SubmitButton className="self-start">{t('save')}</form.SubmitButton>
      </form.AppForm>
    </form>
  );
}
