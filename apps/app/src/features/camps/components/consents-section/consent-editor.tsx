import { EyeIcon } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ConsentEditorFields } from '@/features/camps/components/consents-section/consent-editor-fields';
import { ConsentPreview } from '@/features/camps/components/consents-section/consent-preview';
import {
  useConsentEditor,
  type ConsentDraft,
} from '@/features/camps/components/consents-section/use-consent-editor.hook';

interface ConsentEditorProps {
  organisationId: string;
  campId: string;
  consentId: string | null;
  initial: ConsentDraft;
  // The version the next save publishes.
  nextVersion: number;
  canWrite: boolean;
  onSaved: (consentId: string) => void;
}

// The title, introduction, items and PDF of a Consent, with what guardians will see on demand.
export function ConsentEditor({
  organisationId,
  campId,
  consentId,
  initial,
  nextVersion,
  canWrite,
  onSaved,
}: ConsentEditorProps) {
  const { t } = useTranslation('camps');
  const editor = useConsentEditor(organisationId, campId, consentId, initial, onSaved);
  const [isPreviewShown, setPreviewShown] = useState(false);
  const { draft, revealRef } = editor;

  return (
    <Card ref={revealRef} className="scroll-mt-4">
      <CardHeader className="items-center">
        <CardTitle className="break-words">{draft.title === '' ? t('consents.new') : draft.title}</CardTitle>
        {canWrite ? <Badge variant="warning">{t('consents.draftVersion', { version: nextVersion })}</Badge> : null}
      </CardHeader>
      <ConsentEditorFields editor={editor} canWrite={canWrite} />
      {canWrite ? <Alert variant="warning">{t('consents.versionNote')}</Alert> : null}
      {editor.saved ? (
        <output className="block">
          <Alert variant="success">{t('consents.saved')}</Alert>
        </output>
      ) : null}
      {editor.saveFailed ? (
        <Alert variant="danger" role="alert">
          {t('consents.saveFailed')}
        </Alert>
      ) : null}
      <CardFooter className="justify-end">
        <Button
          type="button"
          variant="outline"
          aria-expanded={isPreviewShown}
          onClick={() => setPreviewShown(!isPreviewShown)}
        >
          <EyeIcon aria-hidden="true" />
          {t('consents.preview')}
        </Button>
        {canWrite ? (
          <Button type="button" disabled={!editor.canSave} onClick={editor.save}>
            {consentId === null ? t('consents.create') : t('consents.publish', { version: nextVersion })}
          </Button>
        ) : null}
      </CardFooter>
      {isPreviewShown ? (
        <ConsentPreview
          title={draft.title}
          introduction={draft.introduction}
          items={draft.items}
          withdrawable={draft.withdrawable}
          fileUrl={draft.file?.link.url ?? null}
        />
      ) : null}
    </Card>
  );
}
