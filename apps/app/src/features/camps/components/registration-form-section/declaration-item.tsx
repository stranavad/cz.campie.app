import { ArrowDownIcon, ArrowUpIcon, FileTextIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import type { ShownDeclaration } from '@repo/schema/camps';

import { FileButton } from '@/components/file-button';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface DeclarationItemProps {
  declaration: ShownDeclaration;
  canWrite: boolean;
  // The PDF's current link.
  link: string | null;
  onChange: (declaration: ShownDeclaration) => void;
  onAttach: (file: File) => void;
  onMove: (by: -1 | 1) => void;
  onRemove: () => void;
}

// One declaration: its text, whether it must be ticked, and a web page or PDF to read first.
export function DeclarationItem({ declaration, canWrite, link, onChange, ...actions }: DeclarationItemProps) {
  const { t } = useTranslation('camps');

  return (
    <div className="flex flex-col gap-2.5 border-t border-border-subtle px-3 py-3">
      <Textarea
        aria-label={t('declarations.text')}
        rows={2}
        className="min-h-20"
        value={declaration.text}
        onChange={(event) => onChange({ ...declaration, text: event.target.value })}
      />
      <label className="flex min-h-11 cursor-pointer items-center gap-2.5 text-sm has-disabled:cursor-not-allowed">
        <input
          type="checkbox"
          className="size-4.5 shrink-0 cursor-pointer accent-primary disabled:cursor-not-allowed"
          checked={declaration.mandatory}
          onChange={(event) => onChange({ ...declaration, mandatory: event.target.checked })}
        />
        {t('declarations.mandatory')}
      </label>
      {declaration.file === null ? (
        <Input
          aria-label={t('declarations.url')}
          placeholder={t('declarations.url')}
          value={declaration.url ?? ''}
          onChange={(event) => onChange({ ...declaration, url: event.target.value === '' ? null : event.target.value })}
        />
      ) : (
        <a
          href={link ?? undefined}
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-h-11 items-center gap-2 self-start text-sm font-semibold underline underline-offset-4 hover:text-brand-text"
        >
          <FileTextIcon aria-hidden="true" className="size-4" />
          {t('declarations.openFile')}
        </a>
      )}
      {canWrite ? (
        <div className="flex flex-wrap items-center gap-1">
          {declaration.url === null && declaration.file === null ? (
            <FileButton
              label={t('declarations.uploadFile')}
              accept="application/pdf"
              size="sm"
              onFile={actions.onAttach}
            />
          ) : null}
          {declaration.file === null ? null : (
            <Button type="button" variant="ghost" size="sm" onClick={() => onChange({ ...declaration, file: null })}>
              {t('declarations.removeFile')}
            </Button>
          )}
          <Button type="button" variant="ghost" size="sm" className="text-danger-foreground" onClick={actions.onRemove}>
            {t('declarations.remove')}
          </Button>
          <span className="ml-auto flex">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={t('registrationForm.moveUp')}
              onClick={() => actions.onMove(-1)}
            >
              <ArrowUpIcon aria-hidden="true" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={t('registrationForm.moveDown')}
              onClick={() => actions.onMove(1)}
            >
              <ArrowDownIcon aria-hidden="true" />
            </Button>
          </span>
        </div>
      ) : null}
    </div>
  );
}
