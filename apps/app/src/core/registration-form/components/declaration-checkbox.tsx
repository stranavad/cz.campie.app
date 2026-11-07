import { useTranslation } from 'react-i18next';

import type { ShownDeclaration } from '@repo/schema/camps';

interface DeclarationCheckboxProps {
  declaration: ShownDeclaration;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

// A declaration as guardians tick it, with its document to open first.
export function DeclarationCheckbox({ declaration, checked, onChange }: DeclarationCheckboxProps) {
  const { t } = useTranslation();
  const document = declaration.file?.link.url ?? declaration.url;

  return (
    <label className="flex items-start gap-2 text-sm">
      <input type="checkbox" className="mt-1" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      <span>
        {declaration.mandatory ? declaration.text : t('form.optional', { label: declaration.text })}
        {document === null ? null : (
          <a href={document} target="_blank" rel="noreferrer" className="ml-1 underline">
            {t('form.openDocument')}
          </a>
        )}
      </span>
    </label>
  );
}
