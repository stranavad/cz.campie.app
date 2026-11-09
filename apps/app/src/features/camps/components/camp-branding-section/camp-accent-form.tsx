import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import type { CampBranding, Turnus } from '@repo/schema/camps';

import { SettingSwitch } from '@/components/setting-switch';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { AccentCheck, AccentPicker } from '@/core/branding';
import { BrandPreview } from '@/features/camps/components/camp-branding-section/brand-preview';
import { useCampAccentForm } from '@/features/camps/components/camp-branding-section/use-camp-accent-form.hook';
import { SaveStatus } from '@/features/camps/components/save-status';

interface CampAccentFormProps {
  organisationId: string;
  campId: string;
  campName: string;
  branding: CampBranding;
  canWrite: boolean;
  // The Camp's Turnusy, shown in the sketch.
  turnusy: readonly Turnus[];
  // The logo's card, under the colour's.
  logo: ReactNode;
}

// The Camp's colour beside a live sketch of its public page in the colour being chosen.
export function CampAccentForm({
  organisationId,
  campId,
  campName,
  branding,
  canWrite,
  turnusy,
  logo,
}: CampAccentFormProps) {
  const { t } = useTranslation('camps');
  const { form, status, previewColourOf, pick } = useCampAccentForm(organisationId, campId, branding);

  return (
    <div className="grid items-start gap-4 lg:grid-cols-5">
      <div className="flex min-w-0 flex-col gap-4 lg:col-span-2">
        <Card>
          <div className="flex flex-col gap-1">
            <CardTitle>{t('branding.colourTitle')}</CardTitle>
            <CardDescription>{t('branding.intro')}</CardDescription>
          </div>
          <form
            noValidate
            className="flex flex-col gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              void form.handleSubmit();
            }}
          >
            <fieldset disabled={!canWrite} className="flex min-w-0 flex-col gap-4">
              <form.AppField name="ownColour">
                {(field) => (
                  <SettingSwitch
                    label={t('branding.ownColour')}
                    description={field.state.value ? undefined : t('branding.organisationColour')}
                    checked={field.state.value}
                    onCheckedChange={field.handleChange}
                  />
                )}
              </form.AppField>
              <form.Subscribe selector={(state) => state.values.ownColour}>
                {(ownColour) =>
                  ownColour ? (
                    <form.AppField name="accentColour">
                      {(field) => (
                        <div className="flex flex-col gap-4">
                          <AccentPicker
                            value={field.state.value}
                            fallback={branding.effective.accentColour}
                            onPick={pick}
                          />
                          <AccentCheck accentColour={field.state.value} />
                        </div>
                      )}
                    </form.AppField>
                  ) : null
                }
              </form.Subscribe>
            </fieldset>
            {canWrite ? (
              <div className="flex flex-wrap items-center gap-3">
                <form.AppForm>
                  <form.SubmitButton>{t('save')}</form.SubmitButton>
                </form.AppForm>
                <SaveStatus status={status} />
              </div>
            ) : null}
          </form>
        </Card>
        {logo}
      </div>
      <form.Subscribe selector={(state) => state.values}>
        {(values) => (
          <BrandPreview
            accentColour={previewColourOf(values)}
            campName={campName}
            logoUrl={branding.effective.logo?.url ?? null}
            turnusy={turnusy}
            className="lg:sticky lg:top-6 lg:col-span-3"
          />
        )}
      </form.Subscribe>
    </div>
  );
}
