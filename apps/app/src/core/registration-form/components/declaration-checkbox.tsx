import { useId } from 'react';
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
  const id = useId();

  return (
    <div className="flex items-start gap-3 py-1 text-[15px] leading-snug">
      <input
        type="checkbox"
        id={id}
        className="mt-0.5 size-5 shrink-0 cursor-pointer accent-brand"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span>
        <label htmlFor={id} className="cursor-pointer">
          {declaration.mandatory ? declaration.text : t('form.optional', { label: declaration.text })}
        </label>
        {document === null ? null : (
          <a
            href={document}
            target="_blank"
            rel="noreferrer"
            className="ml-1.5 font-semibold underline underline-offset-4 transition-colors hover:text-brand-text"
          >
            {t('form.openDocument')}
          </a>
        )}
      </span>
    </div>
  );
}
