import { useId } from 'react';
import { useTranslation } from 'react-i18next';

import { PERMISSION_AREAS, PERMISSION_LEVELS, type PermissionLevel, type Permissions } from '@repo/schema/admins';

interface PermissionsFieldsetProps {
  value: Permissions;
  onChange: (permissions: Permissions) => void;
  disabled?: boolean;
}

// A level for each permission area, in the order the areas are defined.
export function PermissionsFieldset({ value, onChange, disabled = false }: PermissionsFieldsetProps) {
  const { t } = useTranslation('members');
  const id = useId();

  return (
    <div className="grid gap-x-4 gap-y-2 sm:grid-cols-[auto_1fr]">
      {PERMISSION_AREAS.map((area) => (
        <label key={area} htmlFor={`${id}-${area}`} className="contents text-sm">
          <span className="self-center">{t(`areas.${area}`)}</span>
          <select
            id={`${id}-${area}`}
            className="h-8 rounded-lg border border-input bg-transparent px-2 text-sm disabled:opacity-50"
            value={value[area]}
            disabled={disabled}
            onChange={(event) => {
              const level = PERMISSION_LEVELS.find((known) => known === event.target.value);

              if (level !== undefined) {
                onChange({ ...value, [area]: level satisfies PermissionLevel });
              }
            }}
          >
            {PERMISSION_LEVELS.map((level) => (
              <option key={level} value={level}>
                {t(`levels.${level}`)}
              </option>
            ))}
          </select>
        </label>
      ))}
    </div>
  );
}
