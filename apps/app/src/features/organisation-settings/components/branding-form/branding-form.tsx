import { useTranslation } from 'react-i18next';

import type { OrganisationSettings } from '@repo/schema/organisations';

import { AccentPicker, AccentPreview } from '@/core/branding';
import { useBrandingForm } from '@/features/organisation-settings/components/branding-form/use-branding-form.hook';
import { FormMessage } from '@/features/organisation-settings/components/form-message';

interface BrandingFormProps {
  organisationId: string;
  settings: OrganisationSettings;
}

// The display name and accent colour of the public pages, emails and documents.
export function BrandingForm({ organisationId, settings }: BrandingFormProps) {
  const { t } = useTranslation('organisationSettings');
  const { form, status } = useBrandingForm(organisationId, settings);

  return (
    <form
      noValidate
      className="flex flex-col gap-5"
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
          <div className="flex flex-col gap-4">
            <AccentPicker
              value={field.state.value}
              fallback={settings.accentColour}
              onPick={field.handleChange}
              textField={
                <field.TextField
                  label={t('branding.accentColour')}
                  description={t('branding.accentColourHint')}
                  autoCapitalize="none"
                  spellCheck={false}
                  className="font-mono"
                />
              }
            />
            <AccentPreview accentColour={field.state.value} />
          </div>
        )}
      </form.AppField>
      {status === 'saved' ? <FormMessage tone="success">{t('saved')}</FormMessage> : null}
      {status === 'failed' ? <FormMessage tone="danger">{t('failure')}</FormMessage> : null}
      <form.AppForm>
        <form.SubmitButton className="self-start">{t('save')}</form.SubmitButton>
      </form.AppForm>
    </form>
  );
}
