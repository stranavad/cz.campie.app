import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { GrantSupportAccessBody } from '@repo/schema/organisations';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Field, FieldLabel } from '@/components/ui/field';
import { Select } from '@/components/ui/select';

const DURATIONS = [2, 24, 72, 168] as const;

interface SupportGrantFormProps {
  isGranting: boolean;
  onGrant: (body: GrantSupportAccessBody) => void;
}

// How long support may come in, and whether it may change anything.
export function SupportGrantForm({ isGranting, onGrant }: SupportGrantFormProps) {
  const { t } = useTranslation('organisationSettings');
  const [hours, setHours] = useState<number>(24);
  const [allowWrites, setAllowWrites] = useState(false);
  const durationId = useId();
  const writesId = useId();

  return (
    <div className="flex flex-col gap-4">
      <Field className="max-w-xs">
        <FieldLabel htmlFor={durationId}>{t('supportAccess.duration')}</FieldLabel>
        <Select
          id={durationId}
          value={hours}
          onValueChange={setHours}
          options={DURATIONS.map((duration) => ({
            value: duration,
            label: t('supportAccess.hours', { count: duration }),
          }))}
        />
      </Field>
      <Field orientation="horizontal">
        <Checkbox id={writesId} checked={allowWrites} onCheckedChange={(checked) => setAllowWrites(checked)} />
        <FieldLabel htmlFor={writesId} className="font-normal">
          {t('supportAccess.allowWrites')}
        </FieldLabel>
      </Field>
      <Button
        type="button"
        size="sm"
        className="self-start"
        disabled={isGranting}
        onClick={() => onGrant({ hours, allowWrites })}
      >
        {t('supportAccess.grant')}
      </Button>
    </div>
  );
}
