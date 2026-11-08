import { PlusIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import type { ShownDeclaration } from '@repo/schema/camps';

import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { DeclarationItem } from '@/features/camps/components/registration-form-section/declaration-item';
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
    <section className="rounded-3xl border border-border bg-card px-2 pt-1.5 pb-2">
      <fieldset disabled={!canWrite} className="flex min-w-0 flex-col">
        <legend className="float-left flex min-h-14 w-full flex-col justify-center px-3 leading-snug">
          <span className="font-display text-lg font-bold">{t('declarations.title')}</span>
          <span className="text-[13px] text-muted-foreground">{t('declarations.note')}</span>
        </legend>
        <div className="clear-left flex flex-col">
          {declarations.map((declaration, index) => (
            <DeclarationItem
              key={declaration.id}
              declaration={declaration}
              canWrite={canWrite}
              link={linkOf(declaration)}
              onChange={(next) => editor.replace(index, next)}
              onAttach={(file) => editor.attach(declaration.id, file)}
              onMove={(by) => editor.move(index, by)}
              onRemove={() => editor.remove(index)}
            />
          ))}
        </div>
        {editor.uploadFailed ? (
          <Alert variant="danger" role="alert" className="mx-1 mt-2">
            {t('declarations.uploadFailed')}
          </Alert>
        ) : null}
        {canWrite ? (
          <Button type="button" variant="dashed" className="mx-1 mt-2 h-12 sm:h-11" onClick={editor.add}>
            <PlusIcon aria-hidden="true" />
            {t('declarations.add')}
          </Button>
        ) : null}
      </fieldset>
    </section>
  );
}
