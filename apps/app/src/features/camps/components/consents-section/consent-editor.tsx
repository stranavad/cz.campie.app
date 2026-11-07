import { useTranslation } from 'react-i18next';

import { CONSENT_ITEM_KINDS } from '@repo/schema/consents';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  canWrite: boolean;
  onSaved: (consentId: string) => void;
}

const TEXTAREA = 'w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-base md:text-sm';

// The title, introduction, items and PDF of a Consent, with what guardians will see beside it.
export function ConsentEditor({ organisationId, campId, consentId, initial, canWrite, onSaved }: ConsentEditorProps) {
  const { t } = useTranslation('camps');
  const editor = useConsentEditor(organisationId, campId, consentId, initial, onSaved);
  const { draft } = editor;

  return (
    <div className="flex flex-col gap-4">
      <fieldset disabled={!canWrite} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1 text-sm">
          {t('consents.titleLabel')}
          <Input value={draft.title} onChange={(event) => editor.setTitle(event.target.value)} />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          {t('consents.introduction')}
          <textarea
            rows={3}
            className={TEXTAREA}
            value={draft.introduction}
            onChange={(event) => editor.setIntroduction(event.target.value)}
          />
        </label>
        {draft.items.map((item, index) => (
          <div key={item.id} className="flex flex-col gap-2 rounded-lg border border-border p-3">
            <select
              aria-label={t('consents.kind')}
              className="h-9 self-start rounded-lg border border-input bg-transparent px-2 text-sm"
              value={item.kind}
              onChange={(event) =>
                editor.setItemKind(
                  index,
                  item,
                  CONSENT_ITEM_KINDS.find((kind) => kind === event.target.value) ?? item.kind,
                )
              }
            >
              {CONSENT_ITEM_KINDS.map((kind) => (
                <option key={kind} value={kind}>
                  {t(`consents.kinds.${kind}`)}
                </option>
              ))}
            </select>
            <textarea
              aria-label={t('consents.itemText')}
              rows={2}
              className={TEXTAREA}
              value={item.text}
              onChange={(event) => editor.setItemText(index, item, event.target.value)}
            />
            {draft.items.length > 1 ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="self-start"
                onClick={() => editor.removeItem(index)}
              >
                {t('consents.removeItem')}
              </Button>
            ) : null}
          </div>
        ))}
        <Button type="button" size="sm" variant="outline" className="self-start" onClick={editor.addItem}>
          {t('consents.addItem')}
        </Button>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={draft.withdrawable}
            onChange={(event) => editor.setWithdrawable(event.target.checked)}
          />
          {t('consents.withdrawable')}
        </label>
        <div className="flex flex-wrap items-center gap-3 text-sm">
          {draft.file === null ? (
            <label className="flex flex-col gap-1">
              {t('consents.attach')}
              <input
                type="file"
                accept="application/pdf"
                disabled={editor.isUploading}
                onChange={(event) => {
                  const file = event.target.files?.[0];

                  if (file !== undefined) {
                    editor.attach(file);
                  }
                }}
              />
            </label>
          ) : (
            <>
              <a href={draft.file.link.url} target="_blank" rel="noreferrer" className="underline">
                {t('consents.attached')}
              </a>
              <Button type="button" size="sm" variant="outline" onClick={editor.detach}>
                {t('consents.detach')}
              </Button>
            </>
          )}
          {editor.isUploading ? <span className="text-muted-foreground">{t('consents.uploading')}</span> : null}
          {editor.uploadFailed ? <span className="text-destructive">{t('consents.uploadFailed')}</span> : null}
        </div>
        <p className="text-sm text-muted-foreground">{t('consents.versionNote')}</p>
        <div className="flex flex-wrap items-center gap-3">
          <Button type="button" disabled={!editor.canSave} onClick={editor.save}>
            {consentId === null ? t('consents.create') : t('consents.publish')}
          </Button>
          {editor.saved ? <output className="text-sm">{t('consents.saved')}</output> : null}
          {editor.saveFailed ? (
            <p role="alert" className="text-sm text-destructive">
              {t('consents.saveFailed')}
            </p>
          ) : null}
        </div>
      </fieldset>
      <section className="flex flex-col gap-2">
        <h4 className="text-sm font-medium">{t('consents.preview')}</h4>
        <ConsentPreview
          title={draft.title}
          introduction={draft.introduction}
          items={draft.items}
          withdrawable={draft.withdrawable}
          fileUrl={draft.file?.link.url ?? null}
        />
      </section>
    </div>
  );
}
