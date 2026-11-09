import { useTranslation } from 'react-i18next';

import { SettingSwitch } from '@/components/setting-switch';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { withForm } from '@/core/form';
import { campFormOptions } from '@/features/camps/components/camp-form/camp-form.schema';

// The modules whose features exist so far; the others (health record, health log, Oddíly, Vedoucí,
// generated documents) come with their stages and stay as saved until then.
const SWITCHABLE_MODULES = ['consents', 'documents'] as const;

// The parts of the Camp guardians see, switched on or off.
export const CampModulesCard = withForm({
  ...campFormOptions,
  props: { canWrite: false },
  render: function CampModulesCard({ form, canWrite }) {
    const { t } = useTranslation('camps');

    return (
      <Card className="gap-1">
        <CardTitle>{t('modules.title')}</CardTitle>
        <CardDescription className="mb-2">{t('modules.intro')}</CardDescription>
        <fieldset disabled={!canWrite} className="flex min-w-0 flex-col">
          <legend className="sr-only">{t('modules.title')}</legend>
          {SWITCHABLE_MODULES.map((module) => (
            <form.AppField key={module} name={`modules.${module}`}>
              {(field) => (
                <SettingSwitch
                  label={t(`modules.${module}`)}
                  description={t(`modules.descriptions.${module}`)}
                  checked={field.state.value}
                  onCheckedChange={field.handleChange}
                  className="border-t border-border-subtle py-3"
                />
              )}
            </form.AppField>
          ))}
        </fieldset>
      </Card>
    );
  },
});
