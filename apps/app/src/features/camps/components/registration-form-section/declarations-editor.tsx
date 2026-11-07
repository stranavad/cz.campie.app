import { useTranslation } from 'react-i18next';

import type { ShownDeclaration } from '@repo/schema/camps';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  useDeclarationsEditor,
  type DeclarationsUpdate,
} from '@/features/camps/components/registration-form-section/use-declarations-editor.hook';

interface DeclarationsEditorProps {
  organisationId: string;
  campId: string;
  declarations: readonly ShownDeclaration[];
  canWrite: boolean;
  onChange: DeclarationsUpdate;
  // A PDF's current link: the builder's copy keeps the one it got, which expires.
  linkOf: (declaration: ShownDeclaration) => string | null;
}

// The declarations guardians tick, each with an optional web page or PDF to read first.
export function DeclarationsEditor({
  organisationId,
  campId,
  declarations,
  canWrite,
  onChange,
  linkOf,
}: DeclarationsEditorProps) {
  const { t } = useTranslation('camps');
  const editor = useDeclarationsEditor(organisationId, campId, declarations, onChange);

  return (
    <fieldset disabled={!canWrite} className="flex flex-col gap-3">
      <legend className="mb-1 font-medium">{t('declarations.title')}</legend>
      {declarations.map((declaration, index) => (
        <div key={declaration.id} className="flex flex-col gap-2 rounded-lg border border-border p-3">
          <textarea
            aria-label={t('declarations.text')}
            rows={2}
            className="w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-base md:text-sm"
            value={declaration.text}
            onChange={(event) => editor.replace(index, { ...declaration, text: event.target.value })}
          />
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={declaration.mandatory}
              onChange={(event) => editor.replace(index, { ...declaration, mandatory: event.target.checked })}
            />
            {t('declarations.mandatory')}
          </label>
          {declaration.file === null ? (
            <Input
              aria-label={t('declarations.url')}
              placeholder={t('declarations.url')}
              value={declaration.url ?? ''}
              onChange={(event) =>
                editor.replace(index, { ...declaration, url: event.target.value === '' ? null : event.target.value })
              }
            />
          ) : (
            <a href={linkOf(declaration) ?? undefined} target="_blank" rel="noreferrer" className="text-sm underline">
              {t('declarations.openFile')}
            </a>
          )}
          {canWrite ? (
            <div className="flex flex-wrap items-center gap-2">
              {declaration.url === null && declaration.file === null ? (
                <label className="cursor-pointer text-sm underline">
                  {t('declarations.uploadFile')}
                  <input
                    type="file"
                    accept="application/pdf"
                    className="sr-only"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      event.target.value = '';

                      if (file !== undefined) {
                        editor.attach(declaration.id, file);
                      }
                    }}
                  />
                </label>
              ) : null}
              {declaration.file === null ? null : (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => editor.replace(index, { ...declaration, file: null })}
                >
                  {t('declarations.removeFile')}
                </Button>
              )}
              <Button type="button" variant="ghost" size="sm" onClick={() => editor.move(index, -1)}>
                {t('registrationForm.moveUp')}
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => editor.move(index, 1)}>
                {t('registrationForm.moveDown')}
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => editor.remove(index)}>
                {t('declarations.remove')}
              </Button>
            </div>
          ) : null}
        </div>
      ))}
      {editor.uploadFailed ? (
        <p role="alert" className="text-sm text-destructive">
          {t('declarations.uploadFailed')}
        </p>
      ) : null}
      {canWrite ? (
        <Button type="button" variant="outline" className="self-start" onClick={editor.add}>
          {t('declarations.add')}
        </Button>
      ) : null}
    </fieldset>
  );
}
