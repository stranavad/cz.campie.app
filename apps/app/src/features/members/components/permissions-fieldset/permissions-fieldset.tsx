import { Fragment, useId } from 'react';
import { useTranslation } from 'react-i18next';

import { PERMISSION_AREAS, PERMISSION_LEVELS, type Permissions } from '@repo/schema/admins';

import { Select } from '@/components/ui/select';

interface PermissionsFieldsetProps {
  value: Permissions;
  onChange: (permissions: Permissions) => void;
  disabled?: boolean;
}

// A level for each permission area, in the order the areas are defined: stacked on a phone, label beside
// its select from a small width up.
export function PermissionsFieldset({ value, onChange, disabled = false }: PermissionsFieldsetProps) {
  const { t } = useTranslation('members');
  const id = useId();

  return (
    <div className="grid max-w-lg grid-cols-1 gap-x-4 gap-y-2 min-[420px]:grid-cols-[minmax(0,1fr)_11rem]">
      {PERMISSION_AREAS.map((area) => (
        <Fragment key={area}>
          <label htmlFor={`${id}-${area}`} className="self-center pt-1 text-sm font-semibold min-[420px]:pt-0">
            {t(`areas.${area}`)}
          </label>
          <Select
            id={`${id}-${area}`}
            value={value[area]}
            disabled={disabled}
            onValueChange={(level) => onChange({ ...value, [area]: level })}
            options={PERMISSION_LEVELS.map((level) => ({ value: level, label: t(`levels.${level}`) }))}
          />
        </Fragment>
      ))}
    </div>
  );
}
